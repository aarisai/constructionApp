import localforage from 'localforage'
import type { AppState } from '../types'

const stateStore = localforage.createInstance({
  name: 'sankalpa-constructions',
  storeName: 'state',
})

const photoStore = localforage.createInstance({
  name: 'sankalpa-constructions',
  storeName: 'photos',
})

const STATE_KEY = 'app'

export interface StoredPhoto {
  id: string
  blob: Blob
  createdAt: string
}

export async function loadState(): Promise<AppState | null> {
  return stateStore.getItem<AppState>(STATE_KEY)
}

export async function saveState(state: AppState): Promise<void> {
  await stateStore.setItem(STATE_KEY, state)
}

export async function savePhoto(photo: StoredPhoto): Promise<void> {
  await photoStore.setItem(photo.id, photo)
}

export async function deletePhoto(id: string): Promise<void> {
  await photoStore.removeItem(id)
}

export async function allPhotos(): Promise<StoredPhoto[]> {
  const photos: StoredPhoto[] = []
  await photoStore.iterate<StoredPhoto, void>((value) => {
    if (value) photos.push(value)
  })
  return photos
}
