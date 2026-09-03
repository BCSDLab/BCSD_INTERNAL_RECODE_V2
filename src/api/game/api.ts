import { apiClient } from '@/api/client';
import type {
  AdminGameBuildResponse,
  AdminGameDetailResponse,
  AdminGameMemberResponse,
  AdminGameSummaryResponse,
  GameCreateRequest,
  GameRatingRequest,
  GameRatingResponse,
  GameScreenshotResponse,
  GameUpdateRequest,
} from './types';

export function listGames() {
  return apiClient.get<AdminGameSummaryResponse[]>('/v1/admin/games');
}

export function getGame(gameId: number) {
  return apiClient.get<AdminGameDetailResponse>(`/v1/admin/games/${gameId}`);
}

export function createGame(body: GameCreateRequest) {
  return apiClient.post<AdminGameDetailResponse>('/v1/admin/games', body);
}

export function updateGame(gameId: number, body: GameUpdateRequest) {
  return apiClient.put<AdminGameDetailResponse>(`/v1/admin/games/${gameId}`, body);
}

export function changeGameSlug(gameId: number, slug: string) {
  return apiClient.patch<AdminGameDetailResponse>(`/v1/admin/games/${gameId}/slug`, { slug });
}

export function publishGame(gameId: number, isPublished: boolean) {
  return apiClient.patch<void>(`/v1/admin/games/${gameId}/publish`, { isPublished });
}

export function reorderGames(ids: number[]) {
  return apiClient.patch<void>('/v1/admin/games/order', { ids });
}

export function deleteGame(gameId: number) {
  return apiClient.delete<void>(`/v1/admin/games/${gameId}`);
}

export function replaceGameScreenshots(gameId: number, imageUrls: string[]) {
  return apiClient.put<GameScreenshotResponse[]>(`/v1/admin/games/${gameId}/screenshots`, { imageUrls });
}

export function upsertGameRating(gameId: number, body: GameRatingRequest) {
  return apiClient.put<GameRatingResponse>(`/v1/admin/games/${gameId}/rating`, body);
}

export function deleteGameRating(gameId: number) {
  return apiClient.delete<void>(`/v1/admin/games/${gameId}/rating`);
}

export function attachGameMembers(gameId: number, memberIds: number[]) {
  return apiClient.post<AdminGameMemberResponse[]>(`/v1/admin/games/${gameId}/members`, { memberIds });
}

export function detachGameMember(gameId: number, memberId: number) {
  return apiClient.delete<void>(`/v1/admin/games/${gameId}/members/${memberId}`);
}

export function reorderGameMembers(gameId: number, ids: number[]) {
  return apiClient.patch<void>(`/v1/admin/games/${gameId}/members/order`, { ids });
}

export function listGameBuilds(gameId: number) {
  return apiClient.get<AdminGameBuildResponse[]>(`/v1/admin/games/${gameId}/builds`);
}

export function createGameBuild(gameId: number, version: string) {
  return apiClient.post<AdminGameBuildResponse>(`/v1/admin/games/${gameId}/builds`, { version });
}

export function deleteGameBuild(gameId: number, buildId: number) {
  return apiClient.delete<void>(`/v1/admin/games/${gameId}/builds/${buildId}`);
}
