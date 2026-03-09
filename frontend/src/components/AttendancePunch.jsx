import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Coffee, Play, Square, CheckCircle, AlertCircle } from 'lucide-react';
import { showToast } from '../utils/toast';
import { fetchWithAuth } from '../utils/api';

const AttendancePunch = () => {
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState('Office');
  const [notes, setNotes] = useState('');
  const [onBreak, setOnBreak] = useState(false);
  const [breakType, setBreakType] = useState('lunch');
  const [punchLoading, setPunchLoading] = useState(false);

  useEffect(() => {
    fetchPunchStatus();

    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchPunchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth('attendance/status');

      if (response.ok) {
        const data = await response.json();
        setAttendanceStatus(data.data);

        // Check if on break
        if (data.data.attendance?.breaks) {
          const ongoingBreak = data.data.attendance.breaks.find(b => b.breakStart && !b.breakEnd);
          setOnBreak(!!ongoingBreak);
        }
      } else {
        console.error('Failed to fetch punch status');
      }
    } catch (error) {
      console.error('Error fetching punch status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePunchIn = async () => {
    setPunchLoading(true);
    try {
      const response = await fetchWithAuth('attendance/punch-in', {
        method: 'POST',
        body: JSON.stringify({
          location,
          notes
        })
      });

      const data = await response.json();

      if (response.ok) {
        setNotes('');
        fetchPunchStatus();
        showToast.success('Punched in successfully!');
      } else {
        showToast.error(data.message || 'Failed to punch in');
      }
    } catch (error) {
      console.error('Error punching in:', error);
      showToast.error('Error punching in');
    } finally {
      setPunchLoading(false);
    }
  };

  const handlePunchOut = async () => {
    setPunchLoading(true);
    try {
      const response = await fetchWithAuth('attendance/punch-out', {
        method: 'POST',
        body: JSON.stringify({
          location,
          notes
        })
      });

      const data = await response.json();

      if (response.ok) {
        setNotes('');
        fetchPunchStatus();
        showToast.success(`Punched out successfully! Total working time: ${data.data.workingHours}`);
      } else {
        showToast.error(data.message || 'Failed to punch out');
      }
    } catch (error) {
      console.error('Error punching out:', error);
      showToast.error('Error punching out');
    } finally {
      setPunchLoading(false);
    }
  };

  const handleBreakToggle = async () => {
    setPunchLoading(true);
    try {
      const endpoint = onBreak ? 'attendance/break/end' : 'attendance/break/start';
      const response = await fetchWithAuth(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          breakType,
          notes
        })
      });

      const data = await response.json();

      if (response.ok) {
        setNotes('');
        setOnBreak(!onBreak);
        fetchPunchStatus();
        showToast.success(onBreak ? 'Break ended successfully!' : 'Break started successfully!');
      } else {
        showToast.error(data.message || 'Failed to update break status');
      }
    } catch (error) {
      console.error('Error updating break status:', error);
      showToast.error('Error updating break status');
    } finally {
      setPunchLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getWorkingHours = () => {
    if (!attendanceStatus?.attendance?.punchIn?.time) return '0h 0m';

    const punchInTime = new Date(attendanceStatus.attendance.punchIn.time);
    const currentOrPunchOut = attendanceStatus.attendance.punchOut?.time
      ? new Date(attendanceStatus.attendance.punchOut.time)
      : new Date();

    const diffMs = currentOrPunchOut - punchInTime;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Attendance Tracker</h1>
        <p className="text-lg text-zinc-400">{formatDate(currentTime)}</p>
        <p className="text-4xl font-mono text-blue-400 mt-2 font-bold drop-shadow-lg">{formatTime(currentTime)}</p>
      </div>

      {/* Main Punch Card */}
      <div className="max-w-md mx-auto bg-zinc-800/50 backdrop-blur-md rounded-2xl shadow-xl border border-white/5 overflow-hidden">
        <div className="bg-zinc-900/50 p-4 border-b border-white/5">
          <h2 className="text-xl font-bold text-white text-center flex items-center justify-center">
            <Clock className="h-6 w-6 mr-2 text-blue-400" />
            Punch {attendanceStatus?.canPunchIn ? 'In' : attendanceStatus?.canPunchOut ? 'Out' : 'Status'}
          </h2>
        </div>
        <div className="p-6 space-y-6">
          {/* Current Status */}
          {attendanceStatus?.attendance && (
            <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5 shadow-inner">
              <div className="text-center">
                {attendanceStatus.status === 'punched-in' && (
                  <div className="text-emerald-400">
                    <CheckCircle className="h-10 w-10 mx-auto mb-3" />
                    <p className="font-bold text-lg mb-1">Currently Punched In</p>
                    <p className="text-sm text-zinc-400 mb-2">
                      Since: {new Date(attendanceStatus.attendance.punchIn.time).toLocaleTimeString()}
                    </p>
                    <div className="inline-block bg-emerald-500/10 px-3 py-1 rounded-full text-emerald-400 text-sm font-semibold border border-emerald-500/20">
                      Working Time: {getWorkingHours()}
                    </div>
                  </div>
                )}
                {attendanceStatus.status === 'punched-out' && (
                  <div className="text-blue-400">
                    <Square className="h-10 w-10 mx-auto mb-3" />
                    <p className="font-bold text-lg mb-1">Already Punched Out</p>
                    <p className="text-sm text-zinc-400">
                      Total Working Time: {attendanceStatus.attendance.formattedWorkingHours || getWorkingHours()}
                    </p>
                  </div>
                )}
                {attendanceStatus.status === 'not-punched' && (
                  <div className="text-zinc-400">
                    <AlertCircle className="h-10 w-10 mx-auto mb-3" />
                    <p className="font-bold text-lg text-white mb-1">Not Punched In Yet</p>
                    <p className="text-sm">Ready to start your day!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Location Input */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              <MapPin className="h-4 w-4 inline mr-1" />
              Location
            </label>
            <div className="relative">
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-3 pr-10 py-3 bg-zinc-900/50 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 appearance-none"
                disabled={attendanceStatus?.status === 'punched-out'}
              >
                <option value="Office">Office</option>
                <option value="Home">Work from Home</option>
                <option value="Client Site">Client Site</option>
                <option value="Field Work">Field Work</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          {/* Notes Input */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about your punch in/out..."
              className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-zinc-600 disabled:opacity-50"
              rows="3"
              disabled={attendanceStatus?.status === 'punched-out'}
              maxLength="200"
            />
            <p className="text-xs text-zinc-500 mt-1 text-right">{notes.length}/200</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 pt-2">
            {attendanceStatus?.canPunchIn && (
              <button
                onClick={handlePunchIn}
                disabled={punchLoading}
                className="w-full flex items-center justify-center px-4 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20 font-semibold text-lg"
              >
                {punchLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <Play className="h-5 w-5 mr-2 fill-current" />
                )}
                Punch In
              </button>
            )}

            {attendanceStatus?.canPunchOut && (
              <button
                onClick={handlePunchOut}
                disabled={punchLoading}
                className="w-full flex items-center justify-center px-4 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/20 font-semibold text-lg"
              >
                {punchLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <Square className="h-5 w-5 mr-2 fill-current" />
                )}
                Punch Out
              </button>
            )}

            {/* Break Button - Only show if punched in */}
            {attendanceStatus?.status === 'punched-in' && (
              <div className="border-t border-white/10 pt-4 mt-2">
                {!onBreak && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Break Type</label>
                    <div className="relative">
                      <select
                        value={breakType}
                        onChange={(e) => setBreakType(e.target.value)}
                        className="w-full pl-3 pr-10 py-2.5 bg-zinc-900/50 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none"
                      >
                        <option value="lunch">Lunch Break</option>
                        <option value="tea">Tea Break</option>
                        <option value="personal">Personal Break</option>
                        <option value="meeting">Meeting</option>
                        <option value="other">Other</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleBreakToggle}
                  disabled={punchLoading}
                  className={`w-full flex items-center justify-center px-4 py-3 rounded-xl transition-all shadow-lg ${onBreak
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800 shadow-amber-500/20'
                    : 'bg-zinc-700 text-white hover:bg-zinc-600 border border-zinc-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed font-medium`}
                >
                  {punchLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Coffee className="h-4 w-4 mr-2" />
                  )}
                  {onBreak ? 'End Break' : 'Start Break'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Today's Summary */}
      {attendanceStatus?.attendance && (
        <div className="max-w-md mx-auto bg-zinc-800/50 backdrop-blur-md rounded-2xl shadow-lg border border-white/5 overflow-hidden">
          <div className="bg-zinc-900/50 p-3 border-b border-white/5">
            <h3 className="text-center font-semibold text-white">Today's Summary</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-zinc-900/30 p-3 rounded-lg border border-white/5">
                <p className="text-xs text-zinc-400 uppercase tracking-wide">Punch In</p>
                <p className="font-mono font-medium text-white text-lg">
                  {attendanceStatus.attendance.punchIn?.time
                    ? new Date(attendanceStatus.attendance.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '-'
                  }
                </p>
              </div>
              <div className="bg-zinc-900/30 p-3 rounded-lg border border-white/5">
                <p className="text-xs text-zinc-400 uppercase tracking-wide">Punch Out</p>
                <p className="font-mono font-medium text-white text-lg">
                  {attendanceStatus.attendance.punchOut?.time
                    ? new Date(attendanceStatus.attendance.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '-'
                  }
                </p>
              </div>
              <div className="bg-zinc-900/30 p-3 rounded-lg border border-white/5">
                <p className="text-xs text-zinc-400 uppercase tracking-wide">Working Hours</p>
                <p className="font-mono font-medium text-blue-400 text-lg">{getWorkingHours()}</p>
              </div>
              <div className="bg-zinc-900/30 p-3 rounded-lg border border-white/5">
                <p className="text-xs text-zinc-400 uppercase tracking-wide">Status</p>
                <p className="font-medium capitalize text-emerald-400 text-lg">
                  {attendanceStatus.attendance.status?.replace('-', ' ')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePunch;