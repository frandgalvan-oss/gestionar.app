import React from 'react'
import { Link } from 'react-router-dom'
import Logo from './common/Logo'

const Footer = () => {
  const year = new Date().getFullYear()

  const links = {
    Producto: [
      { name: 'Características', href: '#features' },
      { name: 'Precios', to: '/premium' },
      { name: 'Instrucciones', to: '/instrucciones' },
    ],
    Legal: [
      { name: 'Términos', to: '/terminos' },
      { name: 'Privacidad', to: '/terminos' },
    ],
    Contacto: [
      { name: 'Eugenio: +54 9 3467 41-2501' },
      { name: 'Franco: +54 9 3515 63-7053' },
      { name: 'Ignacio: +54 9 3472 58-7090' },
      { name: 'Córdoba, Argentina' },
    ],
  }

  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <a href="#home">
              <Logo size="sm" />
            </a>
            <p className="mt-3 text-sm text-neutral-500 max-w-[200px] leading-relaxed">
              Sistema de gestión empresarial con inteligencia artificial para PyMEs.
            </p>
          </div>

          {/* Link groups */}
          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <h4 className="text-xs font-semibold text-neutral-950 uppercase tracking-wider mb-3">
                {group}
              </h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.name}>
                    {item.to ? (
                      <Link
                        to={item.to}
                        className="text-sm text-neutral-500 hover:text-neutral-950 transition-colors"
                      >
                        {item.name}
                      </Link>
                    ) : item.href ? (
                      <a
                        href={item.href}
                        className="text-sm text-neutral-500 hover:text-neutral-950 transition-colors"
                      >
                        {item.name}
                      </a>
                    ) : (
                      <span className="text-sm text-neutral-400">{item.name}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-neutral-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-neutral-400">
            © {year} gestionar.app · Todos los derechos reservados
          </p>
          <p className="text-xs text-neutral-400">
            Hecho en Córdoba, Argentina 🇦🇷
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
