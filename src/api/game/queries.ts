import { queryOptions } from '@tanstack/react-query';
import { getGame, listGameBuilds, listGames } from './api';

export const gameKeys = {
  games: () => ['games'] as const,
  game: (gameId: number) => ['game', gameId] as const,
  builds: (gameId: number) => ['game', gameId, 'builds'] as const,
};

export const gameQueries = {
  games: () => queryOptions({ queryKey: gameKeys.games(), queryFn: listGames }),
  game: (gameId: number) => queryOptions({ queryKey: gameKeys.game(gameId), queryFn: () => getGame(gameId) }),
  builds: (gameId: number) =>
    queryOptions({ queryKey: gameKeys.builds(gameId), queryFn: () => listGameBuilds(gameId) }),
};
