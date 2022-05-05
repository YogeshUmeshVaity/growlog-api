import { CanActivate } from '@nestjs/common'

/** Represent a type of a Guard. For example, JwtAuthGuard. */
type GuardType = new (...args: any[]) => CanActivate

/** Represent either the route function type or the type of Controller. */
type RouteOrController =
  | ((...args: any[]) => any)
  | (new (...args: any[]) => unknown)

/**
 * Checks whether a route or a Controller is protected with the specified Guard.
 * @param route is the route or Controller to be checked for the Guard.
 * @param guardType is the type of the Guard, e.g. JwtAuthGuard.
 * @returns true if the specified Guard is applied.
 */
export function isGuarded(route: RouteOrController, guardType: GuardType) {
  const guards = retrieveGuardsFrom(route)
  throwIfNoGuards(guards, route, guardType)
  throwIfDifferentGuard(guards, guardType, route)
  return true
}

function throwIfDifferentGuard(
  guards: any,
  guardType: GuardType,
  route: RouteOrController
) {
  let foundGuard = false
  const guardList: string[] = []
  guards.forEach((guard) => {
    guardList.push(guard.name)
    if (guard.name === guardType.name) foundGuard = true
  })

  if (!foundGuard) {
    throw Error(
      `Expected: ${route.name} to be protected with ${guardType.name}\nReceived: only ${guardList}`
    )
  }
}

function throwIfNoGuards(
  guards: any,
  route: RouteOrController,
  guardType: GuardType
) {
  if (!guards) {
    throw Error(
      `Expected: ${route.name} to be protected with ${guardType.name}\nReceived: No guard`
    )
  }
}

function retrieveGuardsFrom(route: RouteOrController) {
  return Reflect.getMetadata('__guards__', route)
}
