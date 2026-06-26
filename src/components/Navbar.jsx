import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Logo from './common/Logo'

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Características', href: '#features' },
    { name: 'Dashboard', href: '#dashboard-preview' },
    { name: 'Precios', href: '/premium', isRoute: true },
  ]

  const scrollTo = (href) => {
    const el = document.querySelector(href)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setIsMobileMenuOpen(false)
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
      isScrolled ? 'border-b border-neutral-200 bg-white/90 backdrop-blur-md' : 'bg-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <a href="#home" onClick={(e) => { e.preventDefault(); scrollTo('#home') }}>
            <Logo size="sm" />
          </a>

          {/* Desktop nav — centrado */}
          <div className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-sm text-neutral-600 hover:text-neutral-950 transition-colors"
                >
                  {link.name}
                </Link>
              ) : (
                <button
                  key={link.name}
                  onClick={() => scrollTo(link.href)}
                  className="text-sm text-neutral-600 hover:text-neutral-950 transition-colors"
                >
                  {link.name}
                </button>
              )
            )}
          </div>

          {/* Acciones */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/register"
              className="text-sm text-neutral-600 hover:text-neutral-950 transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/register"
              className="btn-primary text-sm px-4 py-2 rounded-lg"
            >
              Comenzar gratis
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white/95 backdrop-blur-md animate-fade-in">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50 px-3 py-2 rounded-md transition-colors"
                >
                  {link.name}
                </Link>
              ) : (
                <button
                  key={link.name}
                  onClick={() => scrollTo(link.href)}
                  className="text-sm text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50 px-3 py-2 rounded-md text-left transition-colors"
                >
                  {link.name}
                </button>
              )
            )}
            <div className="pt-3 mt-2 border-t border-neutral-100 flex flex-col gap-2">
              <Link
                to="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="btn-secondary text-sm py-2.5 rounded-lg text-center"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="btn-primary text-sm py-2.5 rounded-lg text-center"
              >
                Comenzar gratis
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
