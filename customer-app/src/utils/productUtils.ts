import { 
  collection, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../api/firebase';

export const updateProductRating = async (productId: string) => {
  if (!productId) return;
  try {
    const q = query(collection(db, 'reviews'), where('productId', '==', productId));
    const snap = await getDocs(q);
    const rs = snap.docs.map(d => d.data());
    let avg = 5.0;
    if (rs.length > 0) {
      avg = rs.reduce((acc, r) => acc + (r.rating || 0), 0) / rs.length;
    }
    await updateDoc(doc(db, 'products', productId), {
      rating: avg.toFixed(1)
    });
  } catch (err) {
    console.error('Error updating product rating:', err);
  }
};
