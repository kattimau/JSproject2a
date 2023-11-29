document.addEventListener('DOMContentLoaded', function () {
    const dropdown = document.getElementById('theater-dropdown');
    const moviesContainer = document.getElementById('movies-container');

    // Funktio teatterien hakuun ja niiden lisäämiseen dropdown-menuun
    function populateTheaters() {
        // Haetaan teatterit Finnkinon rajapinnasta
        fetch('https://www.finnkino.fi/xml/TheatreAreas/')
            .then(response => response.text())
            .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
            .then(data => {
                // Käsitellään haettua XML-dataa ja lisätään teatterit dropdown-menuun
                const theaters = Array.from(data.querySelectorAll('TheatreArea'));
                theaters.sort((a, b) => a.querySelector('Name').textContent.localeCompare(b.querySelector('Name').textContent));
                
                // Tyhjennetään dropdown ennen uusien teatterien lisäämistä
                dropdown.innerHTML = '<option value="">Valitse teatteri</option>';
                
                theaters.forEach(theater => {
                    const option = document.createElement('option');
                    option.value = theater.querySelector('ID').textContent;
                    option.textContent = theater.querySelector('Name').textContent;
                    dropdown.appendChild(option);
                });
            })
            .catch(handleError);
    }

    // funktio jolla elokuvat haetaan teatterin perusteella
    function fetchMovies(theaterId) {
        const url = `https://www.finnkino.fi/xml/Schedule/?area=${theaterId}`;

        // haetaan elokuvat Finnkinon rajapinnasta
        fetch(url)
            .then(response => response.text())
            .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
            .then(data => {
                // asetetaan elokuvat sisältävä container tyhjäksi, näytetään siinä elokuvat hyödyntämällä seuraavaksi määriteltyä funktiota
                moviesContainer.innerHTML = '';
                displayMovies(data, theaterId);
            })
            .catch(handleError);
    }

    // funktio elokuvien näyttämiseen
    function displayMovies(data, theaterId) {
        const shows = data.querySelectorAll('Show');
        shows.forEach(show => {
            const title = show.querySelector('Title').textContent;
            const originalTitle = show.querySelector('OriginalTitle').textContent;
            const showTime = show.querySelector('dttmShowStart').textContent;
            // haetaan ja näytetään elokuvista lisätiedot
            fetchMovieInfo(title, originalTitle, showTime, theaterId);
        });
    }

    // funktio jolla lisätiedot elokuvista haetaan ombdn rajapinnasta
    function fetchMovieInfo(title, originalTitle, showTime, theaterId) {
        const omdbApiKey = '6c2c6b48';
        const url = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&language=fi&apikey=${omdbApiKey}`;

        // haetaan elokuvien lisätiedot ombdn rajapinnasta
        fetch(url)
            .then(response => response.json())
            .then(movieInfo => {
                // jos haku onnistuu, näytetään lisätiedot
                if (movieInfo.Response === "True") {
                    displayMovieInfo(movieInfo, showTime, theaterId);
                }
            })
            .catch(handleError);
    }

    // funktio elokuvien lisätietojen näyttämiseen
    function displayMovieInfo(movieInfo, showTime, theaterId) {
        // muokataan miten halutaan näyttää näytösaika ja luodaan elokuvaelementti
        const showTimeFormatted = new Date(showTime).toLocaleString('fi-FI', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        const movieElement = createMovieElement(movieInfo, showTimeFormatted, theaterId);
        moviesContainer.appendChild(movieElement);

        // järjestetään elokuvat aakkosjärjestykseen (funktio määritellään seuraavaksi)
        sortMovies();
    }

    // funktio jolla elokuvat laitetaan aakkosjärjestykseen
    function sortMovies() {
        const movieElements = Array.from(document.querySelectorAll('.movie'));
        movieElements.sort((a, b) => a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent));

        moviesContainer.innerHTML = '';
        movieElements.forEach(movieElement => {
            moviesContainer.appendChild(movieElement);
        });
    }

    // funktio koko elokuvaelementin luomiseen
    function createMovieElement(movieInfo, showTimeFormatted, theaterId) {
        const movieElement = document.createElement('div');
        movieElement.className = 'movie';
        movieElement.innerHTML = `
            <img src="${movieInfo.Poster}" alt="${movieInfo.Title} poster">
            <h3>${movieInfo.Title}</h3>
            <p>Näytösaika: ${showTimeFormatted}</p>
            <p>Teatteri: ${getTheaterName(theaterId)}</p>
            <p>Genre: ${movieInfo.Genre}</p>
            <p>Ohjaaja: ${movieInfo.Director}</p>
            <p>Näyttelijät: ${movieInfo.Actors}</p>
            <p>Kesto: ${movieInfo.Runtime}</p>
            <p>Ikäraja: ${movieInfo.Rated}</p>
            <details>
                <summary>Kuvaus</summary>
                <p>${movieInfo.Plot}</p>
            </details>
        `;

        return movieElement;
    }

    // funktio jolla teatterin nimi haetaan sen idn perusteella
    function getTheaterName(theaterId) {
        const theaters = Array.from(document.querySelectorAll('option'));
        const selectedTheater = theaters.find(option => option.value === theaterId);
        return selectedTheater ? selectedTheater.textContent : '';
    }

    // jos käy oopsiewoopsie, käsitellään virheet tällä funktiolla
    function handleError(error) {
        console.error('Error:', error);
        dropdown.innerHTML = '<option>Teattereiden lataus epäonnistui</option>';
    }

    // lisätään kuuntelija käyttäjän tekemille muutoksille dropdown-menussa
    dropdown.addEventListener('change', function () {
        const selectedTheaterId = this.value;

        // haetaan valitun teatterin elokuvat
        if (selectedTheaterId && selectedTheaterId !== "Valitse teatteri") {
            fetchMovies(selectedTheaterId);
        }
    });

    // teatterien haku aina kun sivu ladataan
    populateTheaters();
});
