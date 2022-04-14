import { createParamDecorator, ExecutionContext } from '@nestjs/common'

/**
 * Custom decorator for accessing the object of current user inside the route handlers.
 *
 * Instead of the custom decorator, we could directly access the request object in the controller
 * like findMe(@Request request: Request). But then we would have to extract the user from
 * the request in every handler like user = request.currentUser. Custom decorator helps keep the
 * code cleaner and more concise.
 *
 * Whatever we return from here is going to be our argument wherever we use this decorator.
 *
 * The data parameter is whatever you provide as the argument of the decorator. e.g. The data will
 * be 'abc', if you call the decorator like CurrentUser('abc'). Since we are not passing any
 * argument to this decorator, we type it as 'never' instead of unknown or any. Because the type is
 * 'never', if we provide any argument to the decorator, we'll get an error, which is good for type
 * safety.
 */
export const CurrentUser = createParamDecorator(
  (data: never, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest()
    return request.user
  }
)
