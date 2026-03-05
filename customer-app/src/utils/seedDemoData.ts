import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../api/firebase';

export const seedDemoData = async (t: any) => {
    console.log('Starting seed...');

    const niches = [
        {
            name: { fr: 'Summer', en: 'Summer', ar: 'صيف' },
            image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800',
            subs: [
                { name: { fr: 'Plage', en: 'Beachwear', ar: 'ملابس بحر' }, image: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=400' },
                { name: { fr: 'Accessoires', en: 'Accessories', ar: 'إكسسوارات' }, image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400' }
            ],
            products: [
                { name: { fr: 'Maillot de Bain', en: 'Swimsuit', ar: 'ملابس سباحة' }, price: 45, category: 'Plage', description: { fr: 'Confortable et élégant', en: 'Comfortable and elegant', ar: 'مريح وأنيق' }, image: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=400' }
            ]
        },
        {
            name: { fr: 'Femmes', en: 'Women', ar: 'نساء' },
            image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800',
            subs: [
                { name: { fr: 'Robes', en: 'Dresses', ar: 'فساتين' }, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400' },
                { name: { fr: 'Ensembles', en: 'Sets', ar: 'أطقم' }, image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400' }
            ],
            products: [
                { name: { fr: 'Robe d\'été', en: 'Summer Dress', ar: 'فستان صيفي' }, price: 85, category: 'Robes', description: { fr: 'Légère et fleurie', en: 'Light and floral', ar: 'خفيف و مزهر' }, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400' }
            ]
        },
        {
            name: { fr: 'Homme', en: 'Men', ar: 'رجال' },
            image: 'https://images.unsplash.com/photo-1488161628813-244a2ceba245?w=800',
            subs: [
                { name: { fr: 'Chemises', en: 'Shirts', ar: 'قمصان' }, image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400' },
                { name: { fr: 'Pantalons', en: 'Pants', ar: 'سراويل' }, image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400' }
            ],
            products: [
                { name: { fr: 'Chemise en lin', en: 'Linen Shirt', ar: 'قميص كتان' }, price: 65, category: 'Chemises', description: { fr: 'Idéal pour l\'été', en: 'Ideal for summer', ar: 'مثالي للصيف' }, image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400' }
            ]
        }
    ];

    try {
        // Add Brands
        const brandSnap = await getDocs(query(collection(db, 'brands'), where('name', '==', 'Tama Clothing')));
        let brandId = '';
        if (brandSnap.empty) {
            const brandDoc = await addDoc(collection(db, 'brands'), {
                name: 'Tama Clothing',
                image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400',
                isActive: true
            });
            brandId = brandDoc.id;
        } else {
            brandId = brandSnap.docs[0].id;
        }

        for (const niche of niches) {
            // Add Parent Category
            const parentDoc = await addDoc(collection(db, 'categories'), {
                name: niche.name,
                image: niche.image,
                isActive: true,
                parentId: null
            });
            console.log(`Added niche: ${niche.name.en} (${parentDoc.id})`);

            // Add Subcategories
            const subMap: any = {};
            for (const sub of niche.subs) {
                const subDoc = await addDoc(collection(db, 'categories'), {
                    name: sub.name,
                    image: sub.image,
                    isActive: true,
                    parentId: parentDoc.id
                });
                subMap[sub.name.en] = subDoc.id;
                subMap[sub.name.fr] = subDoc.id;
                console.log(`  Added sub: ${sub.name.en} (${subDoc.id})`);
            }

            // Add Products
            for (const prod of niche.products) {
                await addDoc(collection(db, 'products'), {
                    name: prod.name,
                    price: prod.price,
                    description: prod.description,
                    categoryId: subMap[prod.category] || parentDoc.id,
                    brandId: brandId,
                    brandName: 'Tama Clothing',
                    images: [prod.image],
                    mainImage: prod.image,
                    isActive: true,
                    status: 'available',
                    zone: 'Global',
                    createdAt: new Date().toISOString()
                });
                console.log(`    Added product: ${prod.name.en}`);
            }
        }
        return true;
    } catch (error) {
        console.error('Seeding error:', error);
        return false;
    }
};
