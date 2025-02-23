import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Table, LogOut, Settings, Menu, X } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { signOut } from '../lib/auth';

type NavigationProps = {
  user: User;
};

export default function Navigation({ user }: NavigationProps) {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const NavLinks = () => (
    <>
      <Link
        to="/"
        className={`flex items-center px-4 py-2 text-sm font-medium ${
          location.pathname === '/'
            ? 'text-blue-600 bg-blue-50'
            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      >
        <FileText className="w-5 h-5 mr-3" />
        New Record
      </Link>
      <Link
        to="/records"
        className={`flex items-center px-4 py-2 text-sm font-medium ${
          location.pathname === '/records'
            ? 'text-blue-600 bg-blue-50'
            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      >
        <Table className="w-5 h-5 mr-3" />
        View Records
      </Link>
      <Link
        to="/settings"
        className={`flex items-center px-4 py-2 text-sm font-medium ${
          location.pathname === '/settings'
            ? 'text-blue-600 bg-blue-50'
            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      >
        <Settings className="w-5 h-5 mr-3" />
        Account Settings
      </Link>
    </>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-4 left-4 z-20 p-2 rounded-md bg-white shadow-lg"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>

        {/* Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-40 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <span className="text-xl font-bold text-blue-600">BillingTracker</span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="flex flex-col py-4">
            <NavLinks />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
            <div className="mb-2 text-sm text-gray-600 truncate">{user.email}</div>
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden lg:block bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-blue-600">BillingTracker</span>
              </div>
              <div className="ml-6 flex space-x-8">
                <NavLinks />
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-4">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}