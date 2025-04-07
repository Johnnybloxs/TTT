import React, { useState, useEffect } from 'react';
import { Button } from "/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "/components/ui/card";
import { RefreshCw, Trophy, User, Key, LogIn, Flag, Twitter, Instagram, Share2 } from "lucide-react";

// Type definitions
type Player = 'X' | 'O';
type CellValue = Player | null;
type BoardState = CellValue[];
type GameStats = {
  wins: number;
  losses: number;
  draws: number;
};

type UserAccount = {
  id: string;
  username: string;
  password: string;
  stats: GameStats;
  country: string;
  countryCode: string;
};

// Key for localStorage
const ACCOUNTS_STORAGE_KEY = 'ticTacToeAccounts';
const CURRENT_USER_KEY = 'ticTacToeCurrentUser';

// Mock countries for demo
const COUNTRIES = [
  { name: 'United States', code: 'US' },
  { name: 'Canada', code: 'CA' },
  { name: 'United Kingdom', code: 'GB' },
  { name: 'Germany', code: 'DE' },
  { name: 'France', code: 'FR' },
  { name: 'Japan', code: 'JP' },
];

const TicTacToeComplete: React.FC = () => {
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | 'Draw' | null>(null);
  const [winningCells, setWinningCells] = useState<number[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('US');

  // Load accounts and current user from localStorage
  useEffect(() => {
    const savedAccounts = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    const savedUser = localStorage.getItem(CURRENT_USER_KEY);

    if (savedAccounts) {
      try {
        const parsedAccounts = JSON.parse(savedAccounts);
        setAccounts(parsedAccounts);
      } catch (e) {
        console.error('Failed to parse saved accounts', e);
      }
    }

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setCurrentUser(parsedUser);
        setSelectedCountry(parsedUser.countryCode || 'US');
      } catch (e) {
        console.error('Failed to parse current user', e);
      }
    }
  }, []);

  // Save accounts and current user to localStorage when they change
  useEffect(() => {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    if (currentUser) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
    }
  }, [accounts, currentUser]);

  // Check for winner
  const checkWinner = (board: BoardState): Player | 'Draw' | null => {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6]             // diagonals
    ];

    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        setWinningCells(pattern);
        return board[a] as Player;
      }
    }

    return board.includes(null) ? null : 'Draw';
  };

  // Minimax algorithm for AI
  const minimax = (board: BoardState, depth: number, isMaximizing: boolean): number => {
    const result = checkWinner(board);
    
    if (result === 'O') return 10 - depth;
    if (result === 'X') return depth - 10;
    if (result === 'Draw') return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
          board[i] = 'O';
          const score = minimax(board, depth + 1, false);
          board[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
          board[i] = 'X';
          const score = minimax(board, depth + 1, true);
          board[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  // AI makes a move
  const makeAiMove = () => {
    if (winner || currentPlayer !== 'O') return;

    setIsAiThinking(true);
    
    setTimeout(() => {
      let bestScore = -Infinity;
      let bestMove = -1;
      const boardCopy = [...board];

      for (let i = 0; i < boardCopy.length; i++) {
        if (boardCopy[i] === null) {
          boardCopy[i] = 'O';
          const score = minimax(boardCopy, 0, false);
          boardCopy[i] = null;
          if (score > bestScore) {
            bestScore = score;
            bestMove = i;
          }
        }
      }

      if (bestMove !== -1) {
        const newBoard = [...board];
        newBoard[bestMove] = 'O';
        setBoard(newBoard);
        
        const gameWinner = checkWinner(newBoard);
        if (gameWinner) {
          setWinner(gameWinner);
          updateStats(gameWinner);
        } else {
          setCurrentPlayer('X');
        }
      }

      setIsAiThinking(false);
    }, 500);
  };

  // Handle human player move
  const handleCellClick = (index: number) => {
    if (winner || board[index] || currentPlayer !== 'X') return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);

    const gameWinner = checkWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
      updateStats(gameWinner);
    } else {
      setCurrentPlayer('O');
    }
  };

  // Update game statistics
  const updateStats = (result: Player | 'Draw') => {
    if (!currentUser) return;

    setCurrentUser(prev => {
      if (!prev) return null;
      
      const newStats = {
        wins: result === 'X' ? prev.stats.wins + 1 : prev.stats.wins,
        losses: result === 'O' ? prev.stats.losses + 1 : prev.stats.losses,
        draws: result === 'Draw' ? prev.stats.draws + 1 : prev.stats.draws
      };

      // Update in accounts array
      setAccounts(prevAccounts => 
        prevAccounts.map(acc => 
          acc.id === prev.id ? { ...acc, stats: newStats } : acc
        )
      );

      return { ...prev, stats: newStats };
    });
  };

  // Create a new account
  const createAccount = () => {
    if (!username.trim() || !password.trim()) return;

    const country = COUNTRIES.find(c => c.code === selectedCountry) || COUNTRIES[0];
    const newAccount: UserAccount = {
      id: Date.now().toString(),
      username: username.trim(),
      password: password.trim(),
      stats: { wins: 0, losses: 0, draws: 0 },
      country: country.name,
      countryCode: country.code
    };

    setAccounts(prev => [...prev, newAccount]);
    setCurrentUser(newAccount);
    setShowAuthModal(false);
    setUsername('');
    setPassword('');
  };

  // Login to existing account
  const login = () => {
    const account = accounts.find(acc => 
      acc.username === username.trim() && acc.password === loginPassword.trim()
    );

    if (account) {
      setCurrentUser(account);
      setSelectedCountry(account.countryCode);
      setShowAuthModal(false);
      setUsername('');
      setLoginPassword('');
    } else {
      alert('Invalid username or password');
    }
  };

  // Logout current user
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  // Reset game
  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setWinningCells([]);
  };

  // Calculate win rate
  const calculateWinRate = (wins: number, losses: number, draws: number) => {
    const total = wins + losses + draws;
    return total > 0 ? ((wins / total) * 100).toFixed(1) : '0';
  };

  // Get leaderboard data
  const getLeaderboardData = () => {
    return accounts
      .map(account => ({
        id: account.id,
        username: account.username,
        country: account.country,
        countryCode: account.countryCode,
        wins: account.stats.wins,
        losses: account.stats.losses,
        draws: account.stats.draws,
        winRate: calculateWinRate(
          account.stats.wins,
          account.stats.losses,
          account.stats.draws
        )
      }))
      .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate))
      .slice(0, 10); // Top 10 players
  };

  // Get country records
  const getCountryRecords = () => {
    const countryMap: Record<string, any> = {};
    
    accounts.forEach(account => {
      const existing = countryMap[account.countryCode];
      const winRate = calculateWinRate(
        account.stats.wins,
        account.stats.losses,
        account.stats.draws
      );

      if (!existing || parseFloat(winRate) > parseFloat(existing.winRate)) {
        countryMap[account.countryCode] = {
          id: account.id,
          username: account.username,
          country: account.country,
          countryCode: account.countryCode,
          wins: account.stats.wins,
          losses: account.stats.losses,
          draws: account.stats.draws,
          winRate
        };
      }
    });

    return countryMap;
  };

  // Share score on social media
  const shareScore = (platform: string) => {
    if (!currentUser) return;

    const message = `Check out my Tic-Tac-Toe stats! 🎮
Player: ${currentUser.username}
Wins: ${currentUser.stats.wins} | Losses: ${currentUser.stats.losses} | Draws: ${currentUser.stats.draws}
Can you beat my score?`;

    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`, '_blank');
    } else if (platform === 'instagram') {
      window.open('https://instagram.com', '_blank');
    } else {
      if (navigator.share) {
        navigator.share({
          title: 'My Tic-Tac-Toe Stats',
          text: message,
          url: window.location.href
        }).catch(() => {
          alert(message);
        });
      } else {
        alert(message);
      }
    }
  };

  // Trigger AI move when it's O's turn
  useEffect(() => {
    if (currentPlayer === 'O' && !winner) {
      makeAiMove();
    }
  }, [currentPlayer, winner]);

  const renderCell = (index: number) => {
    const isWinningCell = winningCells.includes(index);
    return (
      <button
        key={index}
        onClick={() => handleCellClick(index)}
        className={`w-16 h-16 flex items-center justify-center text-3xl font-bold border border-gray-300
          ${isWinningCell ? 'bg-green-100' : 'hover:bg-gray-100'}
          ${board[index] === 'X' ? 'text-blue-600' : 'text-red-600'}
          ${currentPlayer === 'O' ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        disabled={!!winner || currentPlayer === 'O'}
      >
        {board[index]}
      </button>
    );
  };

  const renderAuthModal = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              {isLoginMode ? 'Login' : 'Create Account'}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Choose a username"
              />
            </div>

            {!isLoginMode && (
              <div>
                <label className="block text-sm font-medium mb-1">Country</label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  {COUNTRIES.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">
                {isLoginMode ? 'Password' : 'Choose Password'}
              </label>
              <input
                type="password"
                value={isLoginMode ? loginPassword : password}
                onChange={(e) => isLoginMode ? setLoginPassword(e.target.value) : setPassword(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder={isLoginMode ? 'Enter your password' : 'Choose a password'}
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setIsLoginMode(!isLoginMode)}
            >
              {isLoginMode ? 'Need an account?' : 'Already have an account?'}
            </Button>
            <Button onClick={isLoginMode ? login : createAccount}>
              {isLoginMode ? 'Login' : 'Create Account'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };

  const renderLeaderboard = () => {
    const leaderboardData = getLeaderboardData();
    const countryRecords = getCountryRecords();
    const userCountryRecord = currentUser ? countryRecords[currentUser.countryCode] : null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Leaderboard
          </h2>
        </div>

        {/* Worldwide Records */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Worldwide Top Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Rank</th>
                    <th className="text-left p-2">Player</th>
                    <th className="text-right p-2">Wins</th>
                    <th className="text-right p-2">Losses</th>
                    <th className="text-right p-2">Draws</th>
                    <th className="text-right p-2">Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardData.length > 0 ? (
                    leaderboardData.map((player, index) => (
                      <tr 
                        key={player.id} 
                        className={`border-b ${currentUser?.id === player.id ? 'bg-blue-50' : ''}`}
                      >
                        <td className="p-2 font-medium">{index + 1}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <Flag className="w-4 h-4" />
                            {player.username}
                          </div>
                        </td>
                        <td className="p-2 text-right">{player.wins}</td>
                        <td className="p-2 text-right">{player.losses}</td>
                        <td className="p-2 text-right">{player.draws}</td>
                        <td className="p-2 text-right font-bold">{player.winRate}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-500">
                        No players yet. Be the first to join the leaderboard!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Country Records */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {currentUser ? `${currentUser.country} Records` : 'Country Records'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userCountryRecord ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Player</th>
                      <th className="text-right p-2">Wins</th>
                      <th className="text-right p-2">Losses</th>
                      <th className="text-right p-2">Draws</th>
                      <th className="text-right p-2">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-green-50">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Flag className="w-4 h-4" />
                          {userCountryRecord.username}
                        </div>
                      </td>
                      <td className="p-2 text-right">{userCountryRecord.wins}</td>
                      <td className="p-2 text-right">{userCountryRecord.losses}</td>
                      <td className="p-2 text-right">{userCountryRecord.draws}</td>
                      <td className="p-2 text-right font-bold">{userCountryRecord.winRate}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                {currentUser ? 'No records for your country yet' : 'Login to see country records'}
              </div>
            )}
          </CardContent>
        </Card>

        {currentUser && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Your Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Player</th>
                      <th className="text-right p-2">Wins</th>
                      <th className="text-right p-2">Losses</th>
                      <th className="text-right p-2">Draws</th>
                      <th className="text-right p-2">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-blue-50">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Flag className="w-4 h-4" />
                          {currentUser.username}
                        </div>
                      </td>
                      <td className="p-2 text-right">{currentUser.stats.wins}</td>
                      <td className="p-2 text-right">{currentUser.stats.losses}</td>
                      <td className="p-2 text-right">{currentUser.stats.draws}</td>
                      <td className="p-2 text-right font-bold">
                        {calculateWinRate(
                          currentUser.stats.wins,
                          currentUser.stats.losses,
                          currentUser.stats.draws
                        )}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderGame = () => {
    return (
      <>
        {/* Game status */}
        <div className="mb-4 text-lg font-semibold">
          {isAiThinking ? (
            <span className="text-gray-600">AI is thinking...</span>
          ) : winner ? (
            winner === 'Draw' ? (
              <span className="text-yellow-600">It's a draw!</span>
            ) : (
              <span className={winner === 'X' ? 'text-blue-600' : 'text-red-600'}>
                {winner === 'X' ? 'You win!' : 'AI wins!'}
              </span>
            )
          ) : (
            <span className={currentPlayer === 'X' ? 'text-blue-600' : 'text-red-600'}>
              {currentPlayer === 'X' ? 'Your turn (X)' : 'AI is playing (O)'}
            </span>
          )}
        </div>

        {/* Game board */}
        <div className="grid grid-cols-3 gap-1 bg-gray-200 p-1 rounded mb-4">
          {Array(9).fill(null).map((_, index) => renderCell(index))}
        </div>

        {/* Statistics */}
        {currentUser ? (
          <div className="w-full grid grid-cols-3 gap-2 text-center mb-4">
            <div className="bg-blue-100 p-2 rounded">
              <div className="font-bold text-blue-800">Wins</div>
              <div className="text-xl">{currentUser.stats.wins}</div>
            </div>
            <div className="bg-yellow-100 p-2 rounded">
              <div className="font-bold text-yellow-800">Draws</div>
              <div className="text-xl">{currentUser.stats.draws}</div>
            </div>
            <div className="bg-red-100 p-2 rounded">
              <div className="font-bold text-red-800">Losses</div>
              <div className="text-xl">{currentUser.stats.losses}</div>
            </div>
          </div>
        ) : (
          <div className="w-full text-center p-4 bg-yellow-50 rounded mb-4">
            <p className="text-yellow-800">
              Create an account to save your stats and appear on the leaderboard!
            </p>
          </div>
        )}

        {/* Social sharing section */}
        {currentUser && (
          <div className="w-full text-center mt-4">
            <p>Share your score on social media!</p>
            <div className="flex justify-center gap-4 mt-2">
              <Button 
                variant="outline" 
                onClick={() => shareScore('twitter')}
                className="flex items-center gap-2"
              >
                <Twitter className="w-4 h-4" />
                X (Twitter)
              </Button>
              <Button 
                variant="outline" 
                onClick={() => shareScore('instagram')}
                className="flex items-center gap-2"
              >
                <Instagram className="w-4 h-4" />
                Instagram
              </Button>
              <Button 
                variant="outline" 
                onClick={() => shareScore('share')}
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {showAuthModal && renderAuthModal()}

      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">
              Tic-Tac-Toe (vs AI)
            </CardTitle>
            {currentUser ? (
              <div className="flex items-center gap-2">
                <span className="font-medium">{currentUser.username}</span>
                <Button variant="outline" size="sm" onClick={logout}>
                  Logout
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center">
          {showLeaderboard ? renderLeaderboard() : renderGame()}
        </CardContent>

        <CardFooter className="flex justify-between">
          {currentUser ? (
            <Button variant="outline" onClick={() => {
              if (confirm('Reset your stats? This cannot be undone.')) {
                setCurrentUser(prev => prev ? {
                  ...prev,
                  stats: { wins: 0, losses: 0, draws: 0 }
                } : null);
              }
            }}>
              Reset Stats
            </Button>
          ) : (
            <div></div>
          )}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="flex items-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              {showLeaderboard ? 'Game' : 'Leaderboard'}
            </Button>
            <Button onClick={resetGame} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              New Game
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TicTacToeComplete;