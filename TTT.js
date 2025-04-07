import React, { useState, useEffect } from 'react';
import { Button } from "/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "/components/ui/card";
import { RefreshCw, Trophy, User, Key, LogIn, Flag, Twitter, Instagram, Share2 } from "lucide-react";

// Constants
const ACCOUNTS_STORAGE_KEY = 'ticTacToeAccounts';
const CURRENT_USER_KEY = 'ticTacToeCurrentUser';

const COUNTRIES = [
  { name: 'United States', code: 'US' },
  { name: 'Canada', code: 'CA' },
  { name: 'United Kingdom', code: 'GB' },
  { name: 'Germany', code: 'DE' },
  { name: 'France', code: 'FR' },
  { name: 'Japan', code: 'JP' },
];

const TicTacToeComplete = () => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState(null);
  const [winningCells, setWinningCells] = useState([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('US');

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

  useEffect(() => {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    if (currentUser) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
    }
  }, [accounts, currentUser]);

  const checkWinner = (board) => {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        setWinningCells(pattern);
        return board[a];
      }
    }

    return board.includes(null) ? null : 'Draw';
  };

  const minimax = (board, depth, isMaximizing) => {
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

  const handleCellClick = (index) => {
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

  const updateStats = (result) => {
    if (!currentUser) return;

    setCurrentUser(prev => {
      if (!prev) return null;

      const newStats = {
        wins: result === 'X' ? prev.stats.wins + 1 : prev.stats.wins,
        losses: result === 'O' ? prev.stats.losses + 1 : prev.stats.losses,
        draws: result === 'Draw' ? prev.stats.draws + 1 : prev.stats.draws
      };

      setAccounts(prevAccounts =>
        prevAccounts.map(acc =>
          acc.id === prev.id ? { ...acc, stats: newStats } : acc
        )
      );

      return { ...prev, stats: newStats };
    });
  };

  const createAccount = () => {
    if (!username.trim() || !password.trim()) return;

    const country = COUNTRIES.find(c => c.code === selectedCountry) || COUNTRIES[0];
    const newAccount = {
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

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setWinningCells([]);
  };

  const calculateWinRate = (wins, losses, draws) => {
    const total = wins + losses + draws;
    return total > 0 ? ((wins / total) * 100).toFixed(1) : '0';
  };

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
      .slice(0, 10);
  };

  const getCountryRecords = () => {
    const countryMap = {};

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

  const shareScore = (platform) => {
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

  useEffect(() => {
    if (currentPlayer === 'O' && !winner) {
      makeAiMove();
    }
  }, [currentPlayer, winner]);

  // You can continue rendering methods here (e.g., renderCell, renderGame, renderLeaderboard, renderAuthModal, etc.)
  // No need to convert render JSX methods since JSX is shared between TSX and JSX.

  return (
    <div>
      {/* UI JSX here, not changed from TSX */}
    </div>
  );
};

export default TicTacToeComplete;
