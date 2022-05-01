import {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
  UseInterceptors
} from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { map, Observable } from 'rxjs'

/**
 * Just makes sure that the object that we pass to the constructor is of some class. Some what
 * better solution that passing 'any' to our Serialize decorator.
 */
interface ClassConstructor {
  new (...args: any[]): unknown
}

/**
 * Wraps up the SerializerInterceptor in a decorator. So we don't have to write a big line of code
 * at the use-site. This class can be re-used for any DTO.
 * @param dtoClassName is the name of the DTO class according to which an object is serialized,
 * e.g. UserDto.
 * @returns the SerializeInterceptor.
 */
export function Serialize(dtoClassName: ClassConstructor) {
  return UseInterceptors(new SerializerInterceptor(dtoClassName))
}

/**
 * Excludes the properties from the response data according to a specified DTO.
 * This interceptor applies to the outgoing response and not to the incoming request because
 * we have defined our logic inside the handler object.
 */
export class SerializerInterceptor implements NestInterceptor {
  /**
   * @param dtoClassName is the name of the DTO class according to which an object is serialized,
   * e.g. UserDto.
   */
  constructor(private dtoClassName: any) {}
  // The data variable here is the default object the Nest sends. e.g. User entity object.
  // We convert that to our dto type.
  // The map operator of RxJS maps the default Observable to our desired Observable.
  intercept(context: ExecutionContext, handler: CallHandler): Observable<any> {
    // The pipe() function takes observables as input and returns another observable.
    // The previous observable stays unmodified.
    return handler.handle().pipe(
      map((data: any) => {
        return plainToInstance(this.dtoClassName, data, {
          // This makes sure only the properties with @Expose in the DTO will be included.
          excludeExtraneousValues: true
        })
      })
    )
  }
}
