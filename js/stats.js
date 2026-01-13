// Správa statistik (načítání, ukládání)
import { CONFIG } from './config.js';

export let playerStats = {
    bestScore: 0,
    totalGames: 0,
    totalPoints: 0,
    averageScore: 0
};

export let highScoreSaved = false;
export let prevBestBeforeUpdate = 0;

export function resetHighScoreSaved() {
    highScoreSaved = false;
}

export function checkAndSaveStats(score) {
    if (highScoreSaved) return;
    highScoreSaved = true;
    prevBestBeforeUpdate = playerStats.bestScore;
    
    const wasNewBest = score > playerStats.bestScore;
    if (wasNewBest) {
        playerStats.bestScore = score;
    }
    playerStats.totalGames += 1;
    playerStats.totalPoints += score;
    playerStats.averageScore = Math.round(playerStats.totalPoints / playerStats.totalGames);
    
    localStorage.setItem('catchItStats', JSON.stringify(playerStats));
    saveStats();
}

export async function loadStats() {
    const localStats = localStorage.getItem('catchItStats');
    if (localStats) {
        try {
            const saved = JSON.parse(localStats);
            playerStats.bestScore = saved.bestScore || 0;
            playerStats.totalGames = saved.totalGames || 0;
            playerStats.totalPoints = saved.totalPoints || 0;
            playerStats.averageScore = saved.averageScore || 0;
            console.log('Stats loaded from localStorage:', playerStats);
        } catch (e) {
            console.log('Error loading from localStorage:', e);
        }
    }
    
    if (CONFIG.JSONBIN_API_KEY && CONFIG.JSONBIN_BIN_ID) {
        console.log('Loading stats from API, Bin ID:', CONFIG.JSONBIN_BIN_ID);
        try {
            const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.JSONBIN_BIN_ID}/latest`, {
                method: 'GET',
                headers: {
                    'X-Master-Key': CONFIG.JSONBIN_API_KEY
                }
            });
            
            console.log('API response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                if (data.record && data.record.bestScore !== undefined) {
                    playerStats = data.record;
                    localStorage.setItem('catchItStats', JSON.stringify(playerStats));
                    console.log('Stats loaded from API:', playerStats);
                }
            } else {
                console.log('API error:', response.status, response.statusText);
            }
        } catch (error) {
            console.log('Failed to load stats from API, using localStorage:', error.message);
        }
    } else if (CONFIG.JSONBIN_API_KEY) {
        console.log('API key set but no Bin ID. Will create on first save.');
    } else {
        console.log('API key not set, using localStorage only');
    }
    
    return Promise.resolve();
}

export async function saveStats() {
    if (CONFIG.JSONBIN_API_KEY) {
        if (!CONFIG.JSONBIN_BIN_ID) {
            console.log('First save - creating new bin in API...');
            try {
                const response = await fetch('https://api.jsonbin.io/v3/b', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': CONFIG.JSONBIN_API_KEY,
                        'X-Bin-Name': 'CatchIt-Stats'
                    },
                    body: JSON.stringify(playerStats)
                });
                
                console.log('API response status (POST):', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    CONFIG.JSONBIN_BIN_ID = data.metadata.id;
                    console.log('Stats saved to API. Bin ID:', CONFIG.JSONBIN_BIN_ID);
                    console.log('Saved data:', playerStats);
                } else {
                    const errorText = await response.text();
                    console.log('API error creating bin:', response.status, errorText);
                }
            } catch (error) {
                console.log('Failed to create bin in API:', error.message);
                console.log('Using localStorage');
            }
        } else {
            console.log('Updating existing bin in API, Bin ID:', CONFIG.JSONBIN_BIN_ID);
            try {
                const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.JSONBIN_BIN_ID}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': CONFIG.JSONBIN_API_KEY
                    },
                    body: JSON.stringify(playerStats)
                });
                
                console.log('API response status (PUT):', response.status);
                
                if (response.ok) {
                    console.log('Stats updated in API');
                    console.log('Updated data:', playerStats);
                } else {
                    const errorText = await response.text();
                    console.log('API error updating:', response.status, errorText);
                }
            } catch (error) {
                console.log('Failed to update stats in API:', error.message);
                console.log('Using localStorage');
            }
        }
    } else {
        console.log('API key not set, using localStorage only');
    }
}

