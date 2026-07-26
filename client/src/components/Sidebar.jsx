import { useState, useEffect } from 'react';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import logo_full from '../assets/fullstackperformance.svg';
import logo_mark from '../assets/fsp.svg';

function Sidebar({ nav_items, collapsed, onToggleCollapsed, footer })
{
    const [is_logo_hovered, setIsLogoHovered] = useState(false);

    useEffect(() =>
    {
        setIsLogoHovered(false);
    }, [collapsed]);

    return (
        <div className={`sidebar${collapsed ? ' collapsed' : ''}`}>
            <div className="sidebar-logo">
                {!collapsed && (
                    <>
                        <img src={logo_full} alt="Full Stack Performance" className="sidebar-logo-mark" />
                        <button className="sidebar-collapse-btn" onClick={onToggleCollapsed}>
                            <ChevronsLeft size={16} />
                        </button>
                    </>
                )}

                {collapsed && (
                    <button
                        className="sidebar-logo-toggle"
                        onClick={onToggleCollapsed}
                        onMouseEnter={() => setIsLogoHovered(true)}
                        onMouseLeave={() => setIsLogoHovered(false)}
                    >
                        {is_logo_hovered
                            ? <ChevronsRight size={16} />
                            : <img src={logo_mark} alt="Full Stack Performance" className="sidebar-logo-mark-collapsed" />}
                    </button>
                )}
            </div>

            <nav className="sidebar-nav">
                {nav_items.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
                    >
                        <item.icon size={16} />
                        {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            {footer !== false && (
                <div className="sidebar-profile">
                    <div className="sidebar-avatar">MF</div>
                    {!collapsed && (
                        <div>
                            <div className="sidebar-profile-name">Matthew Fernando</div>
                            <div className="sidebar-profile-role">Professor</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Sidebar;