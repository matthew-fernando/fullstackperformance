import { useState, useEffect } from 'react';
import { Outlet, useParams, NavLink } from 'react-router-dom';
import { ChartLine, ClipboardList, Network, FileText, Users, Settings, Gauge } from 'lucide-react';
import Sidebar from '../components/Sidebar.jsx';

const API_BASE = 'http://localhost:5001/api';

function buildNavItems(class_id)
{
    const base = `/classes/${class_id}`;

    return [
        { to: `${base}/evaluation`, label: 'Evaluation', icon: ChartLine },
        { to: `${base}/rubrics`, label: 'Rubrics', icon: ClipboardList },
        { to: `${base}/pis`, label: 'PIs', icon: Gauge },
        { to: `${base}/trees`, label: 'Trees', icon: Network },
        { to: `${base}/assignments`, label: 'Assignments', icon: FileText },
        { to: `${base}/students`, label: 'Students', icon: Users },
        { to: `${base}/course-info`, label: 'Course Info', icon: Settings }
    ];
}

function CourseLayout()
{
    const { classId } = useParams();
    const [class_doc, setClassDoc] = useState(null);
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');

    function toggleCollapsed()
    {
        setCollapsed(prev =>
        {
            const next = !prev;
            localStorage.setItem('sidebar_collapsed', String(next));
            return next;
        });
    }

    useEffect(() =>
    {
        fetch(`${API_BASE}/classes/${classId}`)
            .then(res => res.json())
            .then(setClassDoc)
            .catch(error => console.error('Error fetching class:', error));
    }, [classId]);

    const nav_items = buildNavItems(classId);

    return (
        <div className="app-shell">
            <Sidebar nav_items={nav_items} collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
            <div className="main-area">
                <div className="course-header">
                    <NavLink to="/" style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 500 }}>
                        ← All Courses
                    </NavLink>
                    <h1 className="course-header-name" style={{ marginTop: '4px' }}>
                        {class_doc ? class_doc.course_name : 'Loading...'}
                    </h1>
                    {class_doc && (
                        <div className="course-header-meta">
                            <span>{class_doc.course_code}</span>
                            {class_doc.term && (
                                <>
                                    <span className="dot" />
                                    <span>{class_doc.term}</span>
                                </>
                            )}
                        </div>
                    )}
                </div>
                <div className="content-area">
                    <Outlet context={{ class_doc, classId }} />
                </div>
            </div>
        </div>
    );
}

export default CourseLayout;