import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LayoutGrid, Target } from 'lucide-react';
import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';

const NAV_ITEMS = [
    { to: '/', label: 'Courses', icon: LayoutGrid, end: true },
    { to: '/outcomes', label: 'Outcomes', icon: Target }
];

function MainLayout()
{
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');
    const location = useLocation();
    const current_label = NAV_ITEMS.find(item => item.to === location.pathname)?.label ?? 'Courses';

    function toggleCollapsed()
    {
        setCollapsed(prev =>
        {
            const next = !prev;
            localStorage.setItem('sidebar_collapsed', String(next));
            return next;
        });
    }

    return (
        <div className="app-shell">
            <Sidebar nav_items={NAV_ITEMS} collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
            <div className="main-area">
                <Topbar breadcrumbs={[current_label]} />
                <div className="content-area">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

export default MainLayout;