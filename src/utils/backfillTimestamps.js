import { collection, getDocs, writeBatch, doc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTIONS_TO_BACKFILL = ['expenses', 'settlements', 'people'];

export async function backfillMissingTimestamps(userId) {
    let updatedCount = 0;

    for (const collectionName of COLLECTIONS_TO_BACKFILL) {
        const snapshot = await getDocs(collection(db, 'users', userId, collectionName));
        const batch = writeBatch(db);
        let hasWrites = false;

        snapshot.docs.forEach((snap) => {
            const data = snap.data();
            const hasValidTimestamp = data?.timestamp && typeof data.timestamp.toDate === 'function';
            if (!hasValidTimestamp) {
                const ref = doc(db, 'users', userId, collectionName, snap.id);
                batch.update(ref, { timestamp: Timestamp.now() });
                hasWrites = true;
                updatedCount += 1;
            }
        });

        if (hasWrites) {
            await batch.commit();
        }
    }

    return updatedCount;
}

