// backend/server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path'); 

const app = express();
const port = 3000;

const NBA_CONFIG = {
    champion: "TBD",        // update after Finals (e.g. "Oklahoma City Thunder")
    season: "2025-26",
    nextSeasonStart: "October 2026"
};

app.use(cors());
app.use(express.static(path.join(__dirname, '../docs')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../docs', 'games.html'));
});

app.get('/api/v1/games', async (req, res) => {
    const requestedSport = req.query.sport;
    let normalizedGames = [];

    // 1. GENERATE BULLETPROOF TIME ZONE STRING
    const todayLocal = new Date();
    const todayStr = req.query.date || todayLocal.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    
    console.log(`🔍 Live Engine Diagnostic Check | Targeting Date: ${todayStr}`);

    try {
        // 2. SETUP ACTIVE LEAGUE FETCH PIPELINES
        const fetchNBA = (!requestedSport || requestedSport.toUpperCase() === 'NBA') 
            ? axios.get('https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json').catch(() => null) 
            : null;

        const fetchNHL = (!requestedSport || requestedSport.toUpperCase() === 'NHL') 
            ? axios.get('https://api-web.nhle.com/v1/score/now').catch(() => null) 
            : null;

        // FIXED PATH: Pointing exactly to /api/v1/schedule with matching todayStr variable
        const fetchMLB = (!requestedSport || requestedSport.toUpperCase() === 'MLB')
            ? axios.get(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${todayStr}&hydrate=team,broadcasts`).catch(() => null)
            : null;

        const [nbaRes, nhlRes, mlbRes] = await Promise.all([fetchNBA, fetchNHL, fetchMLB]);

        // 3. PARSE NBA DATA (Offseason Safety Check)
        const nbaGames = nbaRes?.data?.scoreboard?.games ?? [];
        const isNBAOffseason = nbaGames.length === 0;

        if (nbaGames.length > 0) {
            nbaGames.forEach(game => {
                normalizedGames.push({
                    sport: "NBA",
                    homeTeam: game.homeTeam.teamTricode,
                    awayTeam: game.awayTeam.teamTricode,
                    time: game.gameStatusText, 
                    tvChannel: "ESPN",
                    floorZone: "Main Floor",
                    isLive: game.gameStatus === 2,
                    isFinal: game.gameStatus === 3,
                    homeScore: game.homeTeam.score,
                    awayScore: game.awayTeam.score
                });
            });
        }

        // 4. PARSE NHL DATA (Offseason Safety Check)
        if (nhlRes?.data?.games) {
            nhlRes.data.games.forEach(game => {
                const state = game.gameState;
                normalizedGames.push({
                    sport: "NHL",
                    homeTeam: game.homeTeam.abbrev || "NHL",
                    awayTeam: game.awayTeam.abbrev || "NHL",
                    time: state === "FUT" ? "UPCOMING" : state === "FINAL" ? "FINAL" : `PER ${game.period}`,
                    tvChannel: "BSDET",
                    floorZone: "Mezzanine",
                    isLive: state === "LIVE" || state === "CRIT",
                    isFinal: state === "FINAL" || state === "OFF",
                    homeScore: game.homeTeam.score || 0,
                    awayScore: game.awayTeam.score || 0
                });
            });
        }

        // 5. PARSE MLB DATA (Live Pipeline)
        if (mlbRes?.data?.dates?.[0]?.games) {
            console.log(`⚾ Found ${mlbRes.data.dates[0].games.length} MLB games from the server!`);
            
            mlbRes.data.dates[0].games.forEach(game => {
                const detailedStatus = game.status?.detailedState || "PRE-GAME";
                const abstractStatus = game.status?.abstractGameState || "";
                
                const isLive = abstractStatus.toLowerCase() === "live" || 
                               detailedStatus.toLowerCase().includes("progress") ||
                               detailedStatus.toLowerCase().includes("warm");

                const homeAbbr = game.teams?.home?.team?.abbreviation || game.teams?.home?.team?.name?.split(' ').pop().toUpperCase().substring(0, 3) || "TBD";
                const awayAbbr = game.teams?.away?.team?.abbreviation || game.teams?.away?.team?.name?.split(' ').pop().toUpperCase().substring(0, 3) || "TBD";

                const broadcasts = game.broadcasts ?? [];
                const tvBroadcast = broadcasts.find(b => b.type === "TV" && b.homeAway === "national")
                    || broadcasts.find(b => b.type === "TV");
                const tvChannel = tvBroadcast?.name ?? "MLB Net";

                normalizedGames.push({
                    sport: "MLB",
                    homeTeam: homeAbbr,
                    awayTeam: awayAbbr,
                    time: isLive ? "LIVE" : detailedStatus.toUpperCase(),
                    tvChannel,
                    floorZone: "Main Bar",
                    isLive: isLive,
                    isFinal: abstractStatus.toLowerCase() === "final",
                    homeScore: game.teams?.home?.score ?? 0,
                    awayScore: game.teams?.away?.score ?? 0
                });
            });
        }

        res.status(200).json({
            success: true,
            activeLiveCount: normalizedGames.filter(g => g.isLive).length,
            games: normalizedGames,
            nbaOffseason: isNBAOffseason ? NBA_CONFIG : null
        });

    } catch (error) {
        console.error("Aggregation Matrix Failure:", error.message);
        res.status(500).json({ success: false, error: "Critical synchronization error." });
    }
});

app.listen(port, () => {
    console.log(`🚀 Sports Bar Core active on http://localhost:${port}`);
});