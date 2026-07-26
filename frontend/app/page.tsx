"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { getMovies, getFavorites, addFavorite, removeFavorite, getStatus, triggerScrape } from '@/lib/api';
import { logout } from '@/app/actions/auth';
import DateTabs from '@/components/DateTabs';
import MovieListRow from '@/components/MovieListRow';
import { format } from 'date-fns';
import { useTranslation } from '@/components/I18nProvider';
import { RefreshIcon, LogoutIcon } from '@/components/icons';

interface Showtime {
  id: number;
  cinema_name: string;
  movie_title: string;
  start_time: string;
  date_str: string;
  ticket_url: string | null;
  movie_url: string | null;
  poster_url: string | null;
  genre: string | null;
  age_restriction: string | null;
  age_restriction_url: string | null;
  details_type: string | null;
}

export default function Home() {
  const { dict } = useTranslation();
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedCinema, setSelectedCinema] = useState<string | null>(null);
  const [lastScraped, setLastScraped] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [showtimesData, favoritesData, statusData] = await Promise.all([
          getMovies(),
          getFavorites(),
          getStatus()
        ]);

        setShowtimes(showtimesData);
        setFavorites(new Set(favoritesData.map((f: { movie_title: string }) => f.movie_title)));
        setLastScraped(statusData.last_scrape_time);

        if (showtimesData.length > 0) {
          const sorted = [...showtimesData].sort((a, b) => new Date(a.date_str).getTime() - new Date(b.date_str).getTime());
          setSelectedDate(sorted[0].date_str);

          const defaultCinema = process.env.NEXT_PUBLIC_DEFAULT_CINEMA;
          if (defaultCinema) {
            const cinemasOnDate = Array.from(new Set(sorted.filter(st => st.date_str === sorted[0].date_str).map(st => st.cinema_name)));
            if (cinemasOnDate.includes(defaultCinema)) {
              setSelectedCinema(defaultCinema);
            }
          }
        } else {
          setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleToggleFavorite = useCallback(async (movieTitle: string) => {
    const isFav = favorites.has(movieTitle);

    // Optimistic update
    setFavorites(prev => {
      const next = new Set(prev);
      if (isFav) next.delete(movieTitle);
      else next.add(movieTitle);
      return next;
    });

    try {
      if (isFav) {
        await removeFavorite(movieTitle);
      } else {
        await addFavorite(movieTitle);
      }
    } catch (error) {
      console.error("Failed to update favorite", error);
      setFavorites(prev => {
        const next = new Set(prev);
        if (isFav) next.add(movieTitle);
        else next.delete(movieTitle);
        return next;
      });
    }
  }, [favorites]);

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await triggerScrape();
      setTimeout(async () => {
        try {
          const [showtimesData, statusData] = await Promise.all([
            getMovies(),
            getStatus()
          ]);
          setShowtimes(showtimesData);
          setLastScraped(statusData.last_scrape_time);
        } catch (error) {
          console.error("Failed to refresh after sync", error);
        } finally {
          setIsSyncing(false);
        }
      }, 5000);
    } catch (error) {
      console.error("Sync failed", error);
      setIsSyncing(false);
    }
  };

  const confirmLogout = async () => {
    await logout();
    window.location.reload();
  };

  // Process data for view
  const { dates, favoritesList, otherMovies, cinemas } = useMemo(() => {
    const uniqueDates = Array.from(new Set(showtimes.map(st => st.date_str))).sort();

    const showtimesForDate = showtimes.filter(st => st.date_str === selectedDate);

    const uniqueCinemas = Array.from(new Set(showtimesForDate.map(st => st.cinema_name))).sort();

    const filteredShowtimes = selectedCinema
      ? showtimesForDate.filter(st => st.cinema_name === selectedCinema)
      : showtimesForDate;

    const moviesMap = new Map<string, { title: string; poster_url: string | null; movie_url: string | null; genre: string | null; age_restriction: string | null; age_restriction_url: string | null; showtimes: { id: number; cinema_name: string; start_time: string; ticket_url: string | null; details_type: string | null }[]; isFavorite: boolean }>();

    filteredShowtimes.forEach(st => {
      if (!moviesMap.has(st.movie_title)) {
        moviesMap.set(st.movie_title, {
          title: st.movie_title,
          poster_url: st.poster_url,
          movie_url: st.movie_url,
          genre: st.genre,
          age_restriction: st.age_restriction,
          age_restriction_url: st.age_restriction_url,
          showtimes: [],
          isFavorite: favorites.has(st.movie_title)
        });
      }
      const movie = moviesMap.get(st.movie_title)!;
      movie.showtimes.push({
        id: st.id,
        cinema_name: st.cinema_name,
        start_time: st.start_time,
        ticket_url: st.ticket_url,
        details_type: st.details_type
      });
    });

    const favoritesList: ReturnType<typeof moviesMap.get>[] = [];
    const otherMovies: ReturnType<typeof moviesMap.get>[] = [];

    Array.from(moviesMap.values()).forEach(m => {
      if (m.isFavorite) favoritesList.push(m);
      else otherMovies.push(m);
    });

    const sortByTitle = (arr: typeof favoritesList) =>
      arr.sort((a, b) => (a?.title || '').localeCompare(b?.title || '', 'hu'));

    return {
      dates: uniqueDates,
      favoritesList: sortByTitle(favoritesList),
      otherMovies: sortByTitle(otherMovies),
      cinemas: uniqueCinemas
    };
  }, [showtimes, selectedDate, favorites, selectedCinema]);


  return (
    <main className="min-h-screen pb-10 bg-background text-foreground">
      {/* Header */}
      <header className="glass shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo / App Name */}
          <div className="flex items-center gap-4 mr-2 md:mr-8 flex-shrink-0">
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight text-foreground whitespace-nowrap">
                {dict.metadata.title}
              </h1>
              {lastScraped && (
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium opacity-70">
                  {dict.common.updated} {format(new Date(lastScraped), 'yyyy-MM-dd HH:mm')}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 flex justify-end gap-2">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${isSyncing
                ? "bg-primary/80 text-primary-foreground cursor-wait"
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                }`}
              title={dict.common.refreshTooltip}
            >
              <RefreshIcon className={isSyncing ? "animate-spin" : ""} />
              <span>{dict.common.refresh}</span>
            </button>

            <button
              onClick={() => setIsLogoutOpen(true)}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
              title={dict.common.logoutTooltip}
            >
              <LogoutIcon />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 pt-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <div>{dict.common.loading}</div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Date Tabs (moved to content) */}
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md mb-0 -mx-4 px-4 md:mx-0 md:px-0">
              <DateTabs
                dates={dates}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                cinemas={cinemas}
                selectedCinema={selectedCinema}
                onSelectCinema={setSelectedCinema}
              />
            </div>

            {favoritesList.length === 0 && otherMovies.length === 0 ? (
              <div className="text-center py-20 opacity-50">
                {dict.common.noData}
              </div>
            ) : (
              <>
                {favoritesList.map((movie) => (
                  <MovieListRow
                    key={movie!.title}
                    movie={movie!}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}

                {favoritesList.length > 0 && otherMovies.length > 0 && (
                  <hr className="my-2 border-border" />
                )}

                {otherMovies.map((movie) => (
                  <MovieListRow
                    key={movie!.title}
                    movie={movie!}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {isLogoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-lg shadow-lg max-w-sm w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">{dict.auth.logoutConfirmTitle}</h3>
            <p className="text-muted-foreground">
              {dict.auth.logoutConfirmMessage}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsLogoutOpen(false)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                {dict.common.cancel}
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-md transition-colors"
              >
                {dict.common.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
