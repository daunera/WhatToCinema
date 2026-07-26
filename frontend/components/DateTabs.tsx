import React, { useRef, useState, useEffect } from 'react';
import { format, parseISO, getDay } from 'date-fns';
import clsx from 'clsx';
import { useTranslation } from '@/components/I18nProvider';
import { FilterIcon } from '@/components/icons';

interface DateTabsProps {
    dates: string[];
    selectedDate: string | null;
    onSelectDate: (date: string) => void;
    cinemas: string[];
    selectedCinema: string | null;
    onSelectCinema: (cinema: string | null) => void;
}

interface DateButtonProps {
    date: string;
    selectedDate: string | null;
    onSelectDate: (date: string) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dateLocale: any;
}

const DateButton = ({ date, selectedDate, onSelectDate, dateLocale }: DateButtonProps) => {
    const isSelected = selectedDate === date;
    const dateObj = parseISO(date);
    const dayName = format(dateObj, 'EEE', { locale: dateLocale });
    const dayNum = format(dateObj, 'MMM d.', { locale: dateLocale });

    return (
        <button
            onClick={() => onSelectDate(date)}
            className={clsx(
                "flex flex-col items-center justify-center px-2 md:px-4 py-1 h-12 rounded-lg text-sm transition-all duration-200 border min-w-[70px]",
                isSelected
                    ? "bg-primary text-primary-foreground shadow-md font-semibold ring-1 ring-primary"
                    : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
            )}
        >
            <span className="text-xs uppercase opacity-80 mb-0.5">{dayName}</span>
            <span className="leading-none whitespace-nowrap">{dayNum}</span>
        </button>
    );
};

export default function DateTabs({
    dates = [],
    selectedDate,
    onSelectDate,
    cinemas = [],
    selectedCinema,
    onSelectCinema
}: DateTabsProps) {
    const { dict, dateLocale } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClick);
        }
        return () => document.removeEventListener('mousedown', handleClick);
    }, [dropdownOpen]);

    const handleCinemaSelect = (cinema: string | null) => {
        onSelectCinema(cinema);
        setDropdownOpen(false);
    };

    return (
        <div className="flex items-center gap-2 -mx-4 px-4 md:mx-0 md:px-1 py-2">
            {/* Cinema Filter Dropdown */}
            <div ref={containerRef} className="relative shrink-0 mr-1">
                <button
                    onClick={() => setDropdownOpen(prev => !prev)}
                    className={clsx(
                        "flex items-center justify-center h-12 rounded-lg transition-colors border gap-2 px-4",
                        selectedCinema
                            ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                            : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
                    )}
                    title={selectedCinema || dict.common.filterCinema}
                >
                    <FilterIcon className="shrink-0" />
                    {selectedCinema && (
                        <span className="text-sm font-medium truncate max-w-[120px]">{selectedCinema}</span>
                    )}
                </button>
                {dropdownOpen && (
                    <div className="absolute left-0 top-full mt-2 w-56 origin-top-left rounded-md bg-popover text-popover-foreground shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 max-h-80 overflow-y-auto">
                        <div className="p-1">
                            <button
                                onClick={() => handleCinemaSelect(null)}
                                className={clsx(
                                    "flex w-full items-center rounded-md px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                                    !selectedCinema && "font-bold bg-accent/50"
                                )}
                            >
                                {dict.common.allCinemas}
                            </button>
                            {cinemas.map((cinema) => (
                                <button
                                    key={cinema}
                                    onClick={() => handleCinemaSelect(cinema)}
                                    className={clsx(
                                        "flex w-full items-center rounded-md px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                                        selectedCinema === cinema && "font-bold bg-accent/50"
                                    )}
                                >
                                    {cinema}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Vertical Divider */}
            <div className="h-8 w-px bg-border flex-shrink-0" />

            {/* Scrollable Date Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-grow mask-fade-right p-1">
                {dates.map((date, index) => {
                    const dateObj = parseISO(date);
                    const isWednesday = getDay(dateObj) === 3;
                    const isLast = index === dates.length - 1;

                    return (
                        <React.Fragment key={date}>
                            <div className="flex-shrink-0">
                                <DateButton
                                    date={date}
                                    selectedDate={selectedDate}
                                    onSelectDate={onSelectDate}
                                    dateLocale={dateLocale}
                                />
                            </div>
                            {isWednesday && !isLast && (
                                <div className="h-8 w-px bg-border flex-shrink-0" />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}
