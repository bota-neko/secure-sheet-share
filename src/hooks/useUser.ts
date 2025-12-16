import useSWR from 'swr';
import { User } from '@/lib/types';

export interface AuthState {
    isLoggedIn: boolean;
    user?: User;
    isLoading: boolean;
    isError: boolean;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function useUser(): AuthState {
    const { data, error, isLoading } = useSWR('/api/me', fetcher);

    return {
        isLoggedIn: data?.isLoggedIn ?? false,
        user: data?.user,
        isLoading,
        isError: error,
    };
}
