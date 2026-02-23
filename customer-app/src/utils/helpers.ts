export const getSafeString = (val: any) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (val.fr) return val.fr;
    if (val['ar-tn']) return val['ar-tn'];
    return '';
};
