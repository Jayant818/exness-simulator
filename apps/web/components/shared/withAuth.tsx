import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import FullscreenLoader from "./FullscreenLoader";
import { useEffect } from "react";

export function withAuth<P extends object>(Component: React.ComponentType<P>) {
    return function AuthComponent(props: P) {
        const {isAuthenticated, loading} = useAuth();
        const router = useRouter();

        useEffect(() => {
            if (!loading && !isAuthenticated) {
                router.push('/login');
            }
        }, [loading, isAuthenticated, router]);

        if (loading || !isAuthenticated) {
            return <FullscreenLoader />;
        }

        return <Component {...props} />;
    }
}