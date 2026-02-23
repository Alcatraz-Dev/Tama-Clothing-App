import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';

export const AppText: any = React.forwardRef<any, any>((props, ref) => {
    let fontFamily = 'Rubik_400Regular';
    if (props.style) {
        const flattened = StyleSheet.flatten(props.style);
        if (flattened.fontWeight === '300') {
            fontFamily = 'Rubik_300Light';
        } else if (flattened.fontWeight === '500') {
            fontFamily = 'Rubik_500Medium';
        } else if (flattened.fontWeight === '600') {
            fontFamily = 'Rubik_600SemiBold';
        } else if (flattened.fontWeight === 'bold' || flattened.fontWeight === '700') {
            fontFamily = 'Rubik_700Bold';
        } else if (flattened.fontWeight === '800') {
            fontFamily = 'Rubik_800ExtraBold';
        } else if (flattened.fontWeight === '900') {
            fontFamily = 'Rubik_900Black';
        }
    }
    return (
        <RNText
            ref={ref}
            {...props}
            style={[
                { fontFamily },
                props.style
            ]}
        />
    );
});
