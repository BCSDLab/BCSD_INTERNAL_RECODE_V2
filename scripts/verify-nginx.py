#!/usr/bin/env python3
"""Smoke-test a built frontend image against an isolated API fixture."""
import json
import subprocess
import sys
import uuid
import urllib.error
import urllib.request

image = sys.argv[1] if len(sys.argv) > 1 else 'bcsd-internal-frontend:local'
prefix = 'bcsd-vite-check-' + uuid.uuid4().hex[:8]
network, backend, frontend = prefix, prefix + '-api', prefix + '-web'


def docker(*args):
    return subprocess.check_output(['docker', *args], text=True).strip()


def request(path, **kwargs):
    req = urllib.request.Request(base + path, **kwargs)
    try:
        response = urllib.request.urlopen(req, timeout=10)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        return response.status, response.headers, response.read()


try:
    docker('network', 'create', network)
    fixture = """
      require('node:http').createServer((req, res) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          res.writeHead(req.url.startsWith('/v1/fail') ? 401 : 200, {
            'Content-Type': 'application/json',
            'Set-Cookie': 'refresh=fixture; Path=/v1; HttpOnly; Secure; SameSite=Lax',
          });
          res.end(JSON.stringify({ url: req.url, method: req.method, headers: req.headers, body }));
        });
      }).listen(8081, '0.0.0.0');
    """
    docker('run', '-d', '--name', backend, '--network', network,
           '--network-alias', 'fixture-api', 'node:24-alpine', 'node', '-e', fixture)
    docker('run', '-d', '--name', frontend, '--network', network,
           '-p', '127.0.0.1::3000', '-e', 'API_ORIGIN=http://fixture-api:8081', image)
    import time
    for _ in range(30):
        state = docker('inspect', '--format', '{{.State.Health.Status}}', frontend)
        if state == 'healthy':
            break
        if state == 'unhealthy':
            raise RuntimeError(docker('logs', frontend))
        time.sleep(1)
    else:
        raise RuntimeError('Frontend did not become healthy')
    port = json.loads(docker('inspect', frontend))[0]['NetworkSettings']['Ports']['3000/tcp'][0]['HostPort']
    base = 'http://127.0.0.1:' + port
    status, headers, html = request('/games/123')
    assert status == 200 and b'<div id="root">' in html
    assert headers['Cache-Control'] == 'no-cache'
    assert request('/ledger/dues/2026-2')[0] == 200
    assert request('/assets/missing.js')[0] == 404
    import re
    asset = re.search(rb'src="(/assets/[^"]+\.js)"', html).group(1).decode()
    status, headers, _ = request(asset)
    assert status == 200 and 'immutable' in headers['Cache-Control']
    status, headers, data = request('/v1/auth/reissue?check=1', method='POST', data=b'{}', headers={
        'Authorization': 'Bearer fixture', 'Cookie': 'refresh=incoming',
        'Content-Type': 'application/json', 'X-Forwarded-Proto': 'https',
    })
    api = json.loads(data)
    assert status == 200 and api['url'] == '/v1/auth/reissue?check=1'
    assert api['method'] == 'POST' and api['body'] == '{}'
    assert api['headers']['authorization'] == 'Bearer fixture'
    assert api['headers']['cookie'] == 'refresh=incoming'
    assert api['headers']['x-forwarded-proto'] == 'https'
    assert 'HttpOnly' in headers['Set-Cookie'] and 'Secure' in headers['Set-Cookie']
    status, headers, data = request('/v1/fail')
    assert status == 401 and headers['Content-Type'] == 'application/json'
    assert json.loads(data)['url'] == '/v1/fail'
    print('Nginx smoke checks passed: deep links, asset caching/404, API path/query/body, auth headers, cookies, API errors')
finally:
    for name in (frontend, backend):
        subprocess.run(['docker', 'rm', '-f', name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run(['docker', 'network', 'rm', network], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
