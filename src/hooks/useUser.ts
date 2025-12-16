import useSWR from 'swr';

export interface User {
    user_id: string;
    login_id: string;
    role: 'admin' | 'facility_admin' | 'facility_editor' | 'facility_viewer';
    facility_id: string;
    google_email?: string;
}

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
