import {
    useNavigate
} from 'react-router-dom';

/**
 * Custom hook for navigation that's backward compatible
 * Maps old page names to new routes
 */
export const useNavigation = () => {
    const navigate = useNavigate();

    const navigateTo = (page) => {
        // Map old page names to new routes for backward compatibility
        const routeMap = {
            'LandingPage': '/',
            'home': '/',
            'Dashboard': '/dashboard',
            'auth-callback': '/auth-callback',
            'receipt-scan': '/receipt-scan',
            'meal-plan': '/meal-plan',
            'about': '/about',
            'contact': '/contact',
            'allergies': '/allergies'
        };

        const route = routeMap[page] || `/${page}`;
        navigate(route);
        window.scrollTo(0, 0);
    };

    return navigateTo;
};