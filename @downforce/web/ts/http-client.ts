import {awaiting} from '@downforce/std/fn-monad'
import {piping} from '@downforce/std/fn-pipe'
import {identity} from '@downforce/std/fn-return'
import type {Io} from '@downforce/std/fn-type'
import {usingRequestAuthorization} from './request-auth.js'
import {usingRequestCache, usingRequestHeaders, usingRequestSignal} from './request-init.js'
import {RequestMethod, creatingRequest, type RequestMethodEnum} from './request-method.js'
import {usingRequestParams} from './request-params.js'
import {usingRequestPayload} from './request-payload.js'
import {usingRequestRetry, type RequestRetryOptions} from './request-retry.js'
import {decodeResponseBody, rejectResponseWhenError} from './response.js'
import type {UrlParams} from './url-params.js'

export {asFormData} from './request-init.js'

export const HttpClient = {
    Request<O = Response>(args: HttpClientBaseOptions<Response, O>): Promise<NoInfer<O>> {
        const {
            authToken,
            baseUrl,
            body,
            cache,
            decoder,
            encoder,
            headers,
            method,
            params,
            retry,
            signal,
            url,
        } = args

        return creatingRequest(method, url, {baseUrl})
            (params ? usingRequestParams(params) : identity)
            (cache ? usingRequestCache(cache) : identity)
            (signal ? usingRequestSignal(signal) : identity)
            (authToken ? usingRequestAuthorization('Bearer', authToken) : identity)
            (headers ? usingRequestHeaders(headers) : identity)
            (usingRequestPayload(body))
            (encoder ? encoder : identity)
            (usingRequestRetry(retry))
            (decoder ? awaiting(decoder) : (identity as Io<Promise<Response>, Promise<O>>))
        ()
    },
    Get<O = Response>(args: HttpClientGetOptions<Response, O>): Promise<NoInfer<O>> {
        return HttpClient.Request({
            ...args,
            method: RequestMethod.Get,
        })
    },
    Delete<O = Response>(args: HttpClientDeleteOptions<Response, O>): Promise<NoInfer<O>> {
        return HttpClient.Request({
            ...args,
            method: RequestMethod.Delete,
        })
    },
    Patch<O = Response>(args: HttpClientPatchOptions<Response, O>): Promise<NoInfer<O>> {
        return HttpClient.Request({
            ...args,
            method: RequestMethod.Patch,
        })
    },
    Put<O = Response>(args: HttpClientPutOptions<Response, O>): Promise<NoInfer<O>> {
        return HttpClient.Request({
            ...args,
            method: RequestMethod.Put,
        })
    },
    Post<O = Response>(args: HttpClientPostOptions<Response, O>): Promise<NoInfer<O>> {
        return HttpClient.Request({
            ...args,
            method: RequestMethod.Post,
        })
    },
}

export function createResponseDecoder(): Io<Response | Promise<Response>, Promise<unknown>>
export function createResponseDecoder<O>(contentDecoder: Io<unknown, O | Promise<O>>): Io<Response | Promise<Response>, Promise<O>>
export function createResponseDecoder<O>(contentDecoder?: undefined | Io<unknown, O | Promise<O>>): Io<Response | Promise<Response>, Promise<unknown | O>> {
    function decode(responsePromise: Response | Promise<Response>): Promise<unknown | O> {
        return decodeResponseOrReject(responsePromise, contentDecoder ?? identity)
    }

    return decode
}

export async function decodeResponseOrReject<O>(
    responsePromise: Response | Promise<Response>,
    decodeContent: Io<unknown, O | Promise<O>>,
): Promise<O> {
    return piping(responsePromise)
        (rejectResponseWhenError) // Rejects on failed response (4xx/5xx).
        (decodeResponseBody) // Decodes response to FormData/JSON/Text/UrlSearchParams.
        (awaiting(decodeContent)) // Decodes the mixed unsafe output.
    ()
}

/**
* This function can be used to cast an `unknown` input to an `Unsafe<?>` input.
* The condition `unknown extends I ? O : unknown` ensures that this function
* can't be used to cast a known value (for example `Response`) to a different
* value (for example `Unsafe<?>`).
*/
export function castingUnknown<O>(fn: Io<any, O>): (<I>(input: I) => unknown extends I ? O : unknown) {
    function cast<I>(input: I): unknown extends I ? O : unknown {
        return fn(input as any)
    }

    return cast
}

// Types ///////////////////////////////////////////////////////////////////////

export interface HttpClientRequestOptions {
    authToken?: undefined | string
    baseUrl?: undefined | string
    body?: undefined | Parameters<typeof usingRequestPayload>[0]
    cache?: undefined | RequestCache
    encoder?: undefined | Io<Request, Request>
    headers?: undefined | HeadersInit
    method: RequestMethodEnum
    params?: undefined | UrlParams
    retry?: undefined | RequestRetryOptions
    signal?: undefined | AbortSignal
    url: string
}

export interface HttpClientResponseOptions<R, O = R> {
    decoder?: undefined | Io<R, O | Promise<O>>
}

export type HttpClientBaseOptions<R, O = R> = HttpClientRequestOptions & HttpClientResponseOptions<R, O>
export type HttpClientGetOptions<R, O = R> = Omit<HttpClientBaseOptions<R, O>, 'method'>
export type HttpClientDeleteOptions<R, O = R> = Omit<HttpClientBaseOptions<R, O>, 'method'>
export type HttpClientPatchOptions<R, O = R> = Omit<HttpClientBaseOptions<R, O>, 'method'>
export type HttpClientPutOptions<R, O = R> = Omit<HttpClientBaseOptions<R, O>, 'method'>
export type HttpClientPostOptions<R, O = R> = Omit<HttpClientBaseOptions<R, O>, 'method'>
