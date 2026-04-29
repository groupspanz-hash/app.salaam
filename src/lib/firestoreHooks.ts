import React, { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, writeBatch, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db, auth } from './firebase';
import { handleFirestoreError, OperationType } from './firebaseErrors';
import { useAuthState } from 'react-firebase-hooks/auth';

export function useFirestoreCollection<T extends { id: string }>(
  collectionName: string,
  initialData: T[] = []
): [T[], (value: React.SetStateAction<T[]>) => void, boolean] {
  const [data, setData] = useState<T[]>(initialData);
  const [user, loading] = useAuthState(auth);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setData(initialData);
      setInitialized(true);
      return;
    }

    const path = `users/${user.uid}/${collectionName}`;
    const q = collection(db, path);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          ...docSnap.data(),
          id: docSnap.id,
        })) as T[];
        setData(items);
        setInitialized(true);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );

    return () => unsubscribe();
  }, [user, loading, collectionName]);

  const setFirestoreData = async (action: React.SetStateAction<T[]>) => {
    if (!user) {
      setData(action);
      return;
    }

    const newData = typeof action === 'function' ? (action as any)(data) : action;
    const oldData = data;

    // Optimistic update
    setData(newData);

    try {
      const batch = writeBatch(db);
      
      const newItemsMap = new Map((newData as T[]).map(item => [item.id, item]));
      const oldItemsMap = new Map((oldData as T[]).map(item => [item.id, item]));

      // Add & Update
      for (const [id, item] of newItemsMap.entries()) {
        const path = `users/${user.uid}/${collectionName}`;
        const ref = doc(db, path, id as string);
        
        // Always add userId before writing and remove any unwanted keys
        const cleanItem = { ...item };
        delete (cleanItem as any).id; // ID is stored as doc ID

        const dataToWrite = { ...cleanItem, userId: user.uid };
        
        const oldItem = oldItemsMap.get(id);
        if (!oldItem || JSON.stringify(oldItem) !== JSON.stringify(item)) {
          batch.set(ref, dataToWrite, { merge: true });
        }
      }

      // Delete
      for (const id of oldItemsMap.keys()) {
        if (!newItemsMap.has(id)) {
          const path = `users/${user.uid}/${collectionName}`;
          batch.delete(doc(db, path, id as string));
        }
      }

      await batch.commit();
    } catch (err) {
      // Rollback on failure
      setData(oldData);
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/${collectionName}`);
    }
  };

  return [data, setFirestoreData, initialized];
}

// For Global object like storeSettings/balances
export function useFirestoreDocument<T extends object>(
  pathSuffix: string,
  initialData: T
): [T, (value: React.SetStateAction<T>) => void, boolean] {
  const [data, setData] = useState<T>(initialData);
  const [user, loading] = useAuthState(auth);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setData(initialData);
      setInitialized(true);
      return;
    }

    const path = `users/${user.uid}/${pathSuffix}`;
    const unsubscribe = onSnapshot(
      doc(db, path),
      (docSnap) => {
        if (docSnap.exists()) {
          setData(docSnap.data() as T);
        } else {
           // Document doesn't exist, will be created on first write
           setData(initialData);
        }
        setInitialized(true);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );

    return () => unsubscribe();
  }, [user, loading, pathSuffix]);

  const setFirestoreData = async (action: React.SetStateAction<T>) => {
    if (!user) {
      setData(action);
      return;
    }

    const newData = typeof action === 'function' ? (action as any)(data) : action;
    const oldData = data;
    setData(newData);

    try {
      const path = `users/${user.uid}/${pathSuffix}`;
      const ref = doc(db, path);
      const cleanData = { ...newData };
      delete (cleanData as any).id;
      const dataToWrite = { ...cleanData, userId: user.uid };
      await setDoc(ref, dataToWrite, { merge: true });
    } catch (err) {
      setData(oldData);
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/${pathSuffix}`);
    }
  };

  return [data, setFirestoreData, initialized];
}
