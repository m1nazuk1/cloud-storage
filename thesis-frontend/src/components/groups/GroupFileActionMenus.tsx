import React, { useState } from 'react';
import {
    FloatingFocusManager,
    FloatingPortal,
    autoUpdate,
    flip,
    offset,
    shift,
    useClick,
    useDismiss,
    useFloating,
    useInteractions,
    useRole,
} from '@floating-ui/react';
import { ChevronDown, Download, Eye, FileUp, FolderOpen, History, NotebookPen, Pencil, Settings2, StickyNote, Trash2, } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface GroupFileActionMenusProps {
    onPreview: () => void;
    onDownload: () => void;
    onNotes: () => void;
    onVersions: () => void;
    onReplace: () => void;
    onRename: () => void;
    onDelete: () => void;
    deletePending: boolean;
    replacePending?: boolean;
    variant?: 'card' | 'table';
}

const panelClass = 'max-h-[min(70vh,22rem)] w-52 overflow-y-auto rounded-xl border border-slate-200/95 bg-white py-1 shadow-lg ring-1 ring-slate-900/5 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:ring-white/10';

function FileActionsDropdown({
    title,
    icon,
    chevronClass,
    triggerClass,
    children,
}: {
    title: string;
    icon: React.ReactNode;
    chevronClass: string;
    triggerClass: string;
    children: (requestClose: () => void) => React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const requestClose = () => setOpen(false);
    const { refs, floatingStyles, context } = useFloating({
        open,
        onOpenChange: setOpen,
        placement: 'bottom-end',
        middleware: [
            offset(6),
            flip({
                padding: 12,
                fallbackPlacements: ['top-end', 'bottom-start', 'top-start', 'left-start', 'right-start'],
            }),
            shift({ padding: 8 }),
        ],
        whileElementsMounted: autoUpdate,
    });
    const click = useClick(context);
    const dismiss = useDismiss(context);
    const role = useRole(context, { role: 'menu' });
    const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

    return (<>
            <button type="button" ref={refs.setReference} className={triggerClass} title={title} aria-label={title} aria-expanded={open} {...getReferenceProps()}>
                {icon}
                <ChevronDown className={chevronClass} aria-hidden/>
            </button>
            {open && (<FloatingPortal>
                    <FloatingFocusManager context={context} modal={false}>
                        <div ref={refs.setFloating} style={floatingStyles} className={`z-[100] ${panelClass}`} {...getFloatingProps()}>
                            {children(requestClose)}
                        </div>
                    </FloatingFocusManager>
                </FloatingPortal>)}
        </>);
}

const itemClass = (danger?: boolean) => `flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors ${danger
    ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40'
    : 'text-slate-800 hover:bg-indigo-50 dark:text-slate-100 dark:hover:bg-indigo-950/40'}`;

const GroupFileActionMenus: React.FC<GroupFileActionMenusProps> = ({
    onPreview,
    onDownload,
    onNotes,
    onVersions,
    onReplace,
    onRename,
    onDelete,
    deletePending,
    replacePending = false,
    variant = 'table',
}) => {
    const { t } = useTranslation();
    const isCard = variant === 'card';
    const triggerClass = isCard
        ? 'inline-flex min-w-0 flex-1 items-center justify-center gap-1 rounded-xl border border-slate-200/90 bg-white/90 px-2 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-700/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 sm:gap-1.5'
        : 'inline-flex items-center gap-1 rounded-lg border border-slate-200/90 bg-white/90 px-1.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-700/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60';
    const chevronClass = `h-3.5 w-3.5 shrink-0 opacity-60 ${isCard ? '' : 'hidden sm:inline'}`;
    const iconWrap = 'h-4 w-4 shrink-0 opacity-90';

    return (<div className={`flex items-center gap-1 ${isCard ? 'w-full flex-wrap sm:flex-nowrap' : 'flex-wrap justify-end'}`}>
            <FileActionsDropdown title={t('group.fileMenu.open')} chevronClass={chevronClass} triggerClass={triggerClass} icon={<>
                        <FolderOpen className={iconWrap}/>
                        {isCard ? (<span className="hidden sm:inline truncate">{t('group.fileMenu.open')}</span>) : null}
                    </>}>
                {(close) => (<>
                        <button type="button" role="menuitem" className={itemClass()} onClick={() => {
                close();
                onPreview();
            }}>
                            <Eye className="h-4 w-4 shrink-0 opacity-80"/>
                            {t('group.preview')}
                        </button>
                        <button type="button" role="menuitem" className={itemClass()} onClick={() => {
                close();
                onDownload();
            }}>
                            <Download className="h-4 w-4 shrink-0 opacity-80"/>
                            {t('group.download')}
                        </button>
                    </>)}
            </FileActionsDropdown>

            <FileActionsDropdown title={t('group.fileMenu.collab')} chevronClass={chevronClass} triggerClass={triggerClass} icon={<>
                        <NotebookPen className={iconWrap}/>
                        {isCard ? (<span className="hidden sm:inline truncate">{t('group.fileMenu.collab')}</span>) : null}
                    </>}>
                {(close) => (<>
                        <button type="button" role="menuitem" className={itemClass()} onClick={() => {
                close();
                onNotes();
            }}>
                            <StickyNote className="h-4 w-4 shrink-0 opacity-80"/>
                            {t('group.notes')}
                        </button>
                        <button type="button" role="menuitem" className={itemClass()} onClick={() => {
                close();
                onVersions();
            }}>
                            <History className="h-4 w-4 shrink-0 opacity-80"/>
                            {t('group.versions')}
                        </button>
                    </>)}
            </FileActionsDropdown>

            <FileActionsDropdown title={t('group.fileMenu.manage')} chevronClass={chevronClass} triggerClass={triggerClass} icon={<>
                        <Settings2 className={iconWrap}/>
                        {isCard ? (<span className="hidden sm:inline truncate">{t('group.fileMenu.manage')}</span>) : null}
                    </>}>
                {(close) => (<>
                        <button type="button" role="menuitem" disabled={replacePending || deletePending} className={`${itemClass()} disabled:opacity-50`} onClick={() => {
                close();
                onReplace();
            }}>
                            <FileUp className="h-4 w-4 shrink-0 opacity-80"/>
                            {replacePending ? t('common.loading') : t('group.replaceFile')}
                        </button>
                        <button type="button" role="menuitem" className={itemClass()} onClick={() => {
                close();
                onRename();
            }}>
                            <Pencil className="h-4 w-4 shrink-0 opacity-80"/>
                            {t('group.rename')}
                        </button>
                        <button type="button" role="menuitem" disabled={deletePending || replacePending} className={`${itemClass(true)} disabled:opacity-50`} onClick={() => {
                close();
                onDelete();
            }}>
                            <Trash2 className="h-4 w-4 shrink-0 opacity-80"/>
                            {deletePending ? t('common.loading') : t('group.delete')}
                        </button>
                    </>)}
            </FileActionsDropdown>
        </div>);
};

export default GroupFileActionMenus;
