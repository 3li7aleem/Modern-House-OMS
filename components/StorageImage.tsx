import React, { useState, useEffect } from 'react';
import { getSignedUrl } from '../src/firebaseService';

interface StorageImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src?: string | null;
    fallback?: string;
}

export const StorageImage: React.FC<StorageImageProps> = ({ 
    src, 
    fallback, 
    ...props 
}) => {
    const localFallback = 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect width="100%" height="100%" fill="#f1f5f9"/><text x="50%" y="50%" text-anchor="middle" fill="#64748b" font-family="sans-serif" font-size="20">Modern House</text></svg>'
    );
    const defaultFallback = fallback || localFallback;
    const [signedUrl, setSignedUrl] = useState<string | null>(src || defaultFallback);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        setHasError(false);
        if (src && !src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('/') && !src.startsWith('blob:')) {
            getSignedUrl(src).then(url => {
                if (isMounted && url) setSignedUrl(url);
            }).catch(() => {
                if (isMounted) setSignedUrl(defaultFallback);
            });
        } else {
            setSignedUrl(src || defaultFallback);
        }
        return () => { isMounted = false; };
    }, [src, defaultFallback]);

    return (
        <img 
            src={hasError ? defaultFallback : (signedUrl || defaultFallback)} 
            onError={() => setHasError(true)}
            loading="lazy"
            {...props} 
        />
    );
};
