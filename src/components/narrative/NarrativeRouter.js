import React, { useState, useEffect } from 'react';

export class NarrativeRouter {
  constructor() {
    this.routes = new Map();
    this.currentRoute = '';
    this.listeners = new Set();

    window.addEventListener('popstate', this.handlePopState.bind(this));
  }

  register(path, component) {
    this.routes.set(path, component);
  }

  navigate(path, state = null) {
    console.log('NarrativeRouter.navigate:', path);
    this.currentRoute = path;
    window.history.pushState(state, '', `${window.location.pathname}#${path}`);
    this.notifyListeners();
  }

  replace(path, state = null) {
    console.log('NarrativeRouter.replace:', path);
    this.currentRoute = path;
    window.history.replaceState(state, '', `${window.location.pathname}#${path}`);
    this.notifyListeners();
  }

  getCurrentRoute() {
    const hash = window.location.hash.substring(1);
    return hash || '/';
  }

  addListener(listener) {
    this.listeners.add(listener);
  }

  removeListener(listener) {
    this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentRoute));
  }

  handlePopState(event) {
    this.currentRoute = this.getCurrentRoute();
    this.notifyListeners();
  }

  parseParams(route) {
    const [path, queryString] = route.split('?');
    let params = {};

    if (queryString) {
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=');
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
      });
    }

    for (const [routePattern] of this.routes) {
      if (this.isRouteMatch(routePattern, path)) {
        const pathParams = this.extractParams(routePattern, path);
        params = { ...params, ...pathParams };
        console.log('Matched route pattern:', routePattern, 'extracted params:', pathParams);
        break;
      }
    }
    
    return { path, params };
  }

  matchRoute(currentRoute) {
    const { path } = this.parseParams(currentRoute);

    if (this.routes.has(path)) {
      return this.routes.get(path);
    }

    for (const [routePath, component] of this.routes) {
      if (this.isRouteMatch(routePath, path)) {
        return component;
      }
    }
    
    return null;
  }

  isRouteMatch(routePattern, actualPath) {
    const routeParts = routePattern.split('/');
    const pathParts = actualPath.split('/');
    
    if (routeParts.length !== pathParts.length) {
      return false;
    }
    
    return routeParts.every((part, index) => {
      return part.startsWith(':') || part === pathParts[index];
    });
  }

  extractParams(routePattern, actualPath) {
    const routeParts = routePattern.split('/');
    const pathParts = actualPath.split('/');
    const params = {};
    
    routeParts.forEach((part, index) => {
      if (part.startsWith(':')) {
        const paramName = part.substring(1);
        params[paramName] = pathParts[index];
      }
    });
    
    return params;
  }
}

export const narrativeRouter = new NarrativeRouter();

export function useNarrativeRouter() {
  const [currentRoute, setCurrentRoute] = useState(narrativeRouter.getCurrentRoute());

  useEffect(() => {
    const handleRouteChange = (route) => {
      console.log('useNarrativeRouter: Route changed to:', route);
      setCurrentRoute(route);
    };

    narrativeRouter.addListener(handleRouteChange);

    const initialRoute = narrativeRouter.getCurrentRoute();
    if (initialRoute !== currentRoute) {
      setCurrentRoute(initialRoute);
    }

    return () => {
      narrativeRouter.removeListener(handleRouteChange);
    };
  }, []);

  return {
    currentRoute,
    navigate: narrativeRouter.navigate.bind(narrativeRouter),
    replace: narrativeRouter.replace.bind(narrativeRouter),
    parseParams: narrativeRouter.parseParams.bind(narrativeRouter)
  };
}

export function NarrativeRoute({ path, component: Component, ...props }) {
  const { currentRoute } = useNarrativeRouter();
  const { path: currentPath } = narrativeRouter.parseParams(currentRoute);
  
  if (path === currentPath || narrativeRouter.isRouteMatch(path, currentPath)) {
    const routeParams = narrativeRouter.extractParams(path, currentPath);
    return <Component {...props} routeParams={routeParams} />;
  }
  
  return null;
}

export function NarrativeLink({ to, children, className, style, state }) {
  const { navigate } = useNarrativeRouter();
  
  const handleClick = (e) => {
    e.preventDefault();
    navigate(to, state);
  };
  
  return (
    <a 
      href={`#${to}`} 
      onClick={handleClick}
      className={className}
      style={{
        textDecoration: 'none',
        color: 'inherit',
        cursor: 'pointer',
        ...style
      }}
    >
      {children}
    </a>
  );
}
