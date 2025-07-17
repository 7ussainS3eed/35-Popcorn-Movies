import { useEffect, useRef, useState } from "react";
import StarRating from "./StarRating.js";

export default function App() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [movies, setMovies] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [watched, setWatched] = useState(function () {
    const storedValue = localStorage.getItem("WatchedLocSto");
    return storedValue ? JSON.parse(storedValue) : [];
  });

  function handleSelectMovie(id) {
    if (id === selectedId) {
      setSelectedId(null);
    } else {
      setSelectedId(id);
    }
  }

  function handleCloseMovie() {
    setSelectedId(null);
    document.title = "Popcorn Movies";
  }

  function handleAddWatched(movie) {
    setWatched((watched) => [...watched, movie]);
  }

  function handleRemoving(id) {
    setWatched((watched) => watched.filter((el) => el.imdbID !== id));
  }

  useEffect(
    function () {
      const controller = new AbortController();
      async function fetchMovies() {
        try {
          setIsLoading(true);
          setError("");
          const res = await fetch(
            `http://www.omdbapi.com/?apikey=458491dc&s=${query}`,
            { signal: controller.signal }
          );
          if (!res.ok) throw new Error();
          const data = await res.json();
          if (data.Response === "False") throw new Error();
          setMovies(data.Search);
        } catch (err) {
          setError("Movie not found or something went wrong !!");
          setMovies([]);
        } finally {
          setIsLoading(false);
        }
      }
      if (!query.length) {
        setError("");
        setMovies([]);
        return;
      }
      handleCloseMovie();
      fetchMovies();
      return function () {
        controller.abort();
      };
    },
    [query]
  );

  useEffect(
    function () {
      localStorage.setItem("WatchedLocSto", JSON.stringify(watched));
    },
    [watched]
  );

  return (
    <>
      <NavBar>
        <Search query={query} setQuery={setQuery} />
        <NumResults movies={movies} />
      </NavBar>
      <Main>
        <Box>
          {!isLoading && !error && (
            <MovieList
              movies={movies ?? []}
              handleSelectMovie={handleSelectMovie}
            />
          )}
          {isLoading && <Loader />}
          {error && <ErrorMessage message={error} />}
        </Box>
        <Box>
          {selectedId ? (
            <MovieDetails
              selectedId={selectedId}
              handleCloseMovie={handleCloseMovie}
              handleAddWatched={handleAddWatched}
              watched={watched}
            />
          ) : (
            <>
              <WatchedSummary watched={watched} />
              <WatchedMovieList
                watched={watched}
                handleRemoving={handleRemoving}
              />
            </>
          )}
        </Box>
      </Main>
    </>
  );
}

function NavBar({ children }) {
  return (
    <nav className="nav-bar">
      <Logo />
      {children}
    </nav>
  );
}

function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>Popcorn Movies</h1>
    </div>
  );
}

function Search({ query, setQuery }) {
  const inputEl = useRef(null);
  useEffect(function () {
    inputEl.current.focus();
  }, []);
  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      ref={inputEl}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}

function NumResults({ movies }) {
  return (
    <p className="num-results">
      Found <strong>{movies.length}</strong> results
    </p>
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "-" : "+"}
      </button>
      {isOpen && children}
    </div>
  );
}

function Loader() {
  return <p className="loader">Loading...</p>;
}

function ErrorMessage({ message }) {
  return <p className="error">{message}</p>;
}

function MovieList({ movies, handleSelectMovie }) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movie
          movie={movie}
          key={movie.imdbID}
          handleSelectMovie={handleSelectMovie}
        />
      ))}
    </ul>
  );
}

function Movie({ movie, handleSelectMovie }) {
  return (
    <li key={movie.imdbID} onClick={() => handleSelectMovie(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);
function WatchedSummary({ watched }) {
  const avgImdbRating = average(
    watched.map((movie) => movie.imdbRating)
  ).toFixed(1);
  const avgUserRating = average(
    watched.map((movie) => movie.passedRate)
  ).toFixed(1);
  const avgRuntime = average(
    watched.map((movie) => +(movie.Runtime?.split(" ")[0] ?? 0))
  ).toFixed(1);
  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime} min</span>
        </p>
      </div>
    </div>
  );
}

function WatchedMovieList({ watched, handleRemoving }) {
  return (
    <ul className="list">
      {watched.map((movie) => (
        <WatchedMovie
          movie={movie}
          key={movie.imdbID}
          handleRemoving={handleRemoving}
        />
      ))}
    </ul>
  );
}

function WatchedMovie({ movie, handleRemoving }) {
  return (
    <li>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.passedRate}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.Runtime}</span>
        </p>
      </div>
      <button
        className="btn-delete"
        onClick={() => handleRemoving(movie.imdbID)}
      >
        X
      </button>
    </li>
  );
}

function MovieDetails({
  selectedId,
  handleCloseMovie,
  handleAddWatched,
  watched,
}) {
  const [shownMovie, setShownMovie] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [passedRate, setPassedRate] = useState("");
  const isWatched = watched.map((el) => el.imdbID).includes(selectedId);
  useEffect(
    function () {
      async function getMovieDetails() {
        setIsLoading(true);
        const res = await fetch(
          `http://www.omdbapi.com/?apikey=458491dc&i=${selectedId}`
        );
        const data = await res.json();
        setShownMovie(data);
        setIsLoading(false);
      }
      getMovieDetails();
    },
    [selectedId]
  );

  if (!shownMovie.Title) {
    document.title = "Loading...";
  } else {
    document.title = "Movie | " + shownMovie.Title;
  }

  return (
    <div className="details">
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <header>
            <button className="btn-back" onClick={handleCloseMovie}>
              &larr;
            </button>
            <img src={shownMovie?.Poster} alt="Poster" />
            <div className="details-overview">
              <h2>{shownMovie.Title}</h2>
              <p>
                {shownMovie.Released} &bull; {shownMovie.Runtime}
              </p>
              <p>{shownMovie.Genre}</p>
              <p>
                <span>⭐</span>
                {shownMovie.imdbRating} IMDb rating
              </p>
            </div>
          </header>
          <section>
            <div className="rating">
              {!isWatched ? (
                <>
                  <StarRating
                    maxRating={10}
                    size={24}
                    setPassedRate={setPassedRate}
                  />
                  {passedRate > 0 && (
                    <button
                      className="btn-add"
                      onClick={() => {
                        handleAddWatched({ ...shownMovie, passedRate });
                        handleCloseMovie();
                      }}
                    >
                      + Add to list
                    </button>
                  )}
                </>
              ) : (
                <p>
                  You rated this movie with
                  {" " +
                    watched.find((el) => el.imdbID === selectedId).passedRate +
                    " "}
                  ⭐
                </p>
              )}
            </div>
            <p>
              <em>{shownMovie.Plot}</em>
            </p>
            <p>Starring {shownMovie.Actors}</p>
            <p>Directed by {shownMovie.Director}</p>
          </section>
        </>
      )}
    </div>
  );
}
