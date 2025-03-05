# Binger

A mobile app built with React Native and Expo that helps you track your favorite TV shows.
Search for shows via TMDB's API, follow them to add to your personal collection, and keep track of new episodes.
The app uses local SQLite storage to maintain your data without requiring a backend server.

## Features

- Search for TV shows using The Movie Database (TMDB) API
- Follow/unfollow shows to build your personal collection
- View all your followed shows in one place
- Local data storage using SQLite
- Backup your database in JSON format - export / import feature
- Cross-platform support for iOS and Android

## Tech Stack

- React Native
- Expo Router
- Expo SQLite
- TMDB API
- TypeScript

## Screenshots

Search and follow your favorite shows:

<img src="./docs/screenshots/1.jpg" alt="my-shows" height="500">

Your shows can be tracked in My Shows section:

<img src="./docs/screenshots/2.jpg" alt="show-detail" height="500">

You can mark entire seasons as watched...

<img src="./docs/screenshots/3.jpg" alt="episodes-detail" height="500">

...Or spread out a season and mark individual episodes:

<img src="./docs/screenshots/4.jpg" alt="backup" height="500">

You can save your data as a JSON file and import it to another device:

<img src="./docs/screenshots/5.jpg" alt="backup" height="500">

Light mode is also available:

<img src="./docs/screenshots/light.jpg" alt="backup" height="500">
