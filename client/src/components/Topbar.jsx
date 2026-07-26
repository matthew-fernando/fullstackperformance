function Topbar({ breadcrumbs, actions })
{
    return (
        <div className="topbar">
            <div className="topbar-breadcrumbs">
                {breadcrumbs.map((crumb, index) => (
                    <span key={index} className={index === breadcrumbs.length - 1 ? 'current' : ''}>
                        {crumb}{index < breadcrumbs.length - 1 ? ' /' : ''}
                    </span>
                ))}
            </div>
            <div className="topbar-actions">{actions}</div>
        </div>
    );
}

export default Topbar;