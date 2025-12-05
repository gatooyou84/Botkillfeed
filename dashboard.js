// Configuration
const API_BASE_URL = window.location.origin;
let adminPassword = '';

// Gestion de l'authentification
function login() {
    const password = document.getElementById('admin-password').value;
    
    if (!password) {
        showLoginError('Veuillez entrer un mot de passe');
        return;
    }

    adminPassword = password;
    
    // Tester l'authentification en faisant un appel API
    fetch(`${API_BASE_URL}/api/config/discord`, {
        headers: {
            'X-Admin-Password': adminPassword
        }
    })
    .then(response => {
        if (response.ok) {
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            localStorage.setItem('adminPassword', adminPassword);
            loadDashboard();
        } else {
            showLoginError('Mot de passe incorrect');
        }
    })
    .catch(error => {
        showLoginError('Erreur de connexion au serveur');
    });
}

function logout() {
    localStorage.removeItem('adminPassword');
    adminPassword = '';
    document.getElementById('login-screen').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('admin-password').value = '';
}

function showLoginError(message) {
    const errorDiv = document.getElementById('login-error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 3000);
}

// Chargement initial
window.onload = function() {
    const savedPassword = localStorage.getItem('adminPassword');
    if (savedPassword) {
        adminPassword = savedPassword;
        document.getElementById('admin-password').value = savedPassword;
        login();
    }
};

// Utilitaires API
function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'X-Admin-Password': adminPassword
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    return fetch(`${API_BASE_URL}${endpoint}`, options)
        .then(response => response.json());
}

// Navigation entre tabs
function showTab(tabName) {
    // Cacher tous les tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Afficher le tab sélectionné
    document.getElementById(`tab-${tabName}`).classList.add('active');
    event.target.classList.add('active');

    // Charger les données du tab
    switch(tabName) {
        case 'overview':
            loadOverview();
            break;
        case 'server':
            loadServerStatus();
            break;
        case 'zones':
            loadZones();
            break;
        case 'shop':
            loadShop();
            break;
        case 'players':
            loadPlayers();
            break;
        case 'discord':
            loadDiscordConfig();
            break;
    }
}

// Chargement du dashboard
function loadDashboard() {
    loadOverview();
}

// Vue d'ensemble
function loadOverview() {
    // Charger les stats
    apiCall('/api/config/stats/economy')
        .then(data => {
            if (data.success) {
                displayOverviewStats(data.stats);
            }
        });

    // Charger les joueurs en ligne
    apiCall('/api/config/stats/online')
        .then(data => {
            if (data.success) {
                const statsDiv = document.getElementById('overview-stats');
                const onlineCount = data.players.length;
                
                statsDiv.innerHTML = `
                    <div class="stat-card">
                        <h4>Joueurs en ligne</h4>
                        <div class="value">${onlineCount}</div>
                    </div>
                `;
            }
        });
}

function displayOverviewStats(stats) {
    // Top Kills
    const topKillsDiv = document.getElementById('top-players-kills');
    if (stats.topKillers && stats.topKillers.length > 0) {
        topKillsDiv.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Joueur</th>
                        <th>Kills</th>
                        <th>Deaths</th>
                        <th>K/D</th>
                    </tr>
                </thead>
                <tbody>
                    ${stats.topKillers.map((player, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${player.playerName}</td>
                            <td>${player.kills}</td>
                            <td>${player.deaths}</td>
                            <td>${player.kd.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else {
        topKillsDiv.innerHTML = '<p>Aucune donnée disponible</p>';
    }

    // Top Richesse
    const topMoneyDiv = document.getElementById('top-players-money');
    if (stats.topRich && stats.topRich.length > 0) {
        topMoneyDiv.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Joueur</th>
                        <th>Balance</th>
                        <th>Rang</th>
                    </tr>
                </thead>
                <tbody>
                    ${stats.topRich.map((player, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${player.playerName}</td>
                            <td>${player.balance} 💰</td>
                            <td>${player.rank}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else {
        topMoneyDiv.innerHTML = '<p>Aucune donnée disponible</p>';
    }
}

// Gestion du serveur
function loadServerStatus() {
    apiCall('/api/config/server/status')
        .then(data => {
            if (data.success) {
                const statusDiv = document.getElementById('server-status');
                const status = data.status;
                
                statusDiv.innerHTML = `
                    <p><strong>Nom:</strong> ${status.name}</p>
                    <p><strong>Statut:</strong> <span class="server-status ${status.online ? 'online' : 'offline'}">
                        ${status.online ? '🟢 En ligne' : '🔴 Hors ligne'}
                    </span></p>
                    <p><strong>Joueurs:</strong> ${status.players} / ${status.maxPlayers}</p>
                    ${status.map ? `<p><strong>Map:</strong> ${status.map}</p>` : ''}
                    ${status.ip ? `<p><strong>IP:</strong> ${status.ip}:${status.port}</p>` : ''}
                `;
            }
        })
        .catch(error => {
            document.getElementById('server-status').innerHTML = 
                '<div class="error">Erreur de connexion à l\'API Nitrado</div>';
        });
}

function startServer() {
    if (!confirm('Voulez-vous démarrer le serveur ?')) return;
    
    apiCall('/api/config/server/start', 'POST')
        .then(data => {
            showServerMessage(data.message, data.success ? 'success' : 'error');
            setTimeout(loadServerStatus, 2000);
        });
}

function restartServer() {
    if (!confirm('Voulez-vous redémarrer le serveur ? Les joueurs seront déconnectés.')) return;
    
    apiCall('/api/config/server/restart', 'POST')
        .then(data => {
            showServerMessage(data.message, data.success ? 'success' : 'error');
            setTimeout(loadServerStatus, 2000);
        });
}

function stopServer() {
    if (!confirm('Voulez-vous arrêter le serveur ? Les joueurs seront déconnectés.')) return;
    
    apiCall('/api/config/server/stop', 'POST')
        .then(data => {
            showServerMessage(data.message, data.success ? 'success' : 'error');
            setTimeout(loadServerStatus, 2000);
        });
}

function showServerMessage(message, type) {
    const messageDiv = document.getElementById('server-message');
    messageDiv.innerHTML = `<div class="${type}">${message}</div>`;
    setTimeout(() => {
        messageDiv.innerHTML = '';
    }, 5000);
}

// Gestion des zones
function loadZones() {
    apiCall('/api/config/zones')
        .then(data => {
            if (data.success) {
                displayZones(data.zones);
            }
        });
}

function displayZones(zones) {
    const zonesList = document.getElementById('zones-list');
    
    if (zones.length === 0) {
        zonesList.innerHTML = '<p>Aucune zone configurée</p>';
        return;
    }

    zonesList.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Nom</th>
                    <th>Type</th>
                    <th>Position</th>
                    <th>Rayon</th>
                    <th>Auto-ban</th>
                    <th>Statut</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${zones.map(zone => `
                    <tr>
                        <td>${zone.name}</td>
                        <td>${zone.type}</td>
                        <td>${zone.center.x.toFixed(0)}, ${zone.center.y.toFixed(0)}, ${zone.center.z.toFixed(0)}</td>
                        <td>${zone.radius}m</td>
                        <td>${zone.autoBan ? '✅' : '❌'}</td>
                        <td>${zone.enabled ? '🟢 Activée' : '🔴 Désactivée'}</td>
                        <td>
                            <button class="btn btn-danger" onclick="deleteZone('${zone.id}')">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function showAddZoneForm() {
    document.getElementById('add-zone-form').style.display = 'block';
}

function hideAddZoneForm() {
    document.getElementById('add-zone-form').style.display = 'none';
}

function addZone() {
    const zone = {
        name: document.getElementById('zone-name').value,
        type: document.getElementById('zone-type').value,
        center: {
            x: parseFloat(document.getElementById('zone-x').value),
            y: parseFloat(document.getElementById('zone-y').value),
            z: parseFloat(document.getElementById('zone-z').value)
        },
        radius: parseFloat(document.getElementById('zone-radius').value),
        enabled: document.getElementById('zone-enabled').checked,
        autoBan: document.getElementById('zone-autoban').checked,
        banDuration: document.getElementById('zone-ban-duration').value,
        description: document.getElementById('zone-description').value
    };

    apiCall('/api/config/zones', 'POST', zone)
        .then(data => {
            if (data.success) {
                alert('Zone créée avec succès !');
                hideAddZoneForm();
                loadZones();
            } else {
                alert('Erreur lors de la création de la zone');
            }
        });
}

function deleteZone(zoneId) {
    if (!confirm('Voulez-vous vraiment supprimer cette zone ?')) return;

    apiCall(`/api/config/zones/${zoneId}`, 'DELETE')
        .then(data => {
            if (data.success) {
                alert('Zone supprimée');
                loadZones();
            }
        });
}

// Gestion de la boutique
function loadShop() {
    apiCall('/api/config/shop')
        .then(data => {
            if (data.success) {
                displayShop(data.items);
            }
        });
}

function displayShop(items) {
    const shopDiv = document.getElementById('shop-items');
    
    if (items.length === 0) {
        shopDiv.innerHTML = '<p>Aucun item dans la boutique</p>';
        return;
    }

    shopDiv.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Nom</th>
                    <th>Catégorie</th>
                    <th>Prix</th>
                    <th>Stock</th>
                    <th>Rang requis</th>
                    <th>Statut</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.category}</td>
                        <td>${item.price} 💰</td>
                        <td>${item.stock !== undefined ? item.stock : '∞'}</td>
                        <td>${item.requiredRank || 'Aucun'}</td>
                        <td>${item.enabled ? '✅' : '❌'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Gestion des joueurs
function loadPlayers() {
    const sortBy = document.getElementById('player-sort').value;
    
    // Joueurs en ligne
    apiCall('/api/config/stats/online')
        .then(data => {
            if (data.success) {
                displayOnlinePlayers(data.players);
            }
        });

    // Top joueurs
    apiCall(`/api/config/stats/players?sortBy=${sortBy}&limit=50`)
        .then(data => {
            if (data.success) {
                displayPlayersList(data.players);
            }
        });
}

function displayOnlinePlayers(players) {
    const onlineDiv = document.getElementById('online-players');
    
    if (players.length === 0) {
        onlineDiv.innerHTML = '<p>Aucun joueur en ligne</p>';
        return;
    }

    onlineDiv.innerHTML = `
        <p><strong>${players.length} joueur(s) en ligne</strong></p>
        <table>
            <thead>
                <tr>
                    <th>Nom</th>
                    <th>Position</th>
                    <th>Santé</th>
                </tr>
            </thead>
            <tbody>
                ${players.map(player => `
                    <tr>
                        <td>${player.playerName}</td>
                        <td>${player.currentPosition ? 
                            `${player.currentPosition.x.toFixed(0)}, ${player.currentPosition.y.toFixed(0)}` : 
                            'N/A'}</td>
                        <td>${player.health !== undefined ? player.health + '%' : 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function displayPlayersList(players) {
    const playersDiv = document.getElementById('players-list');
    
    if (players.length === 0) {
        playersDiv.innerHTML = '<p>Aucune donnée disponible</p>';
        return;
    }

    playersDiv.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Nom</th>
                    <th>Kills</th>
                    <th>Deaths</th>
                    <th>K/D</th>
                    <th>Headshots</th>
                    <th>Longest Kill</th>
                    <th>Temps de jeu</th>
                </tr>
            </thead>
            <tbody>
                ${players.map((player, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${player.playerName}</td>
                        <td>${player.kills}</td>
                        <td>${player.deaths}</td>
                        <td>${player.kd.toFixed(2)}</td>
                        <td>${player.headshots}</td>
                        <td>${player.longestKill.toFixed(0)}m</td>
                        <td>${Math.floor(player.playtime / 3600)}h</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Configuration Discord
function loadDiscordConfig() {
    apiCall('/api/config/discord')
        .then(data => {
            if (data.success) {
                displayDiscordConfig(data.config);
            }
        });
}

function displayDiscordConfig(config) {
    const discordDiv = document.getElementById('discord-config');
    
    discordDiv.innerHTML = `
        <table>
            <tr>
                <th>Paramètre</th>
                <th>Valeur</th>
            </tr>
            <tr>
                <td>Guild ID</td>
                <td>${config.guildId || 'Non configuré'}</td>
            </tr>
            <tr>
                <td>Channel Killfeed</td>
                <td>${config.killfeedChannelId || 'Non configuré'}</td>
            </tr>
            <tr>
                <td>Channel Logs</td>
                <td>${config.logsChannelId || 'Non configuré'}</td>
            </tr>
            <tr>
                <td>Channel Raids</td>
                <td>${config.raidsChannelId || 'Non configuré'}</td>
            </tr>
            <tr>
                <td>Channel Économie</td>
                <td>${config.economyChannelId || 'Non configuré'}</td>
            </tr>
        </table>
    `;
}
