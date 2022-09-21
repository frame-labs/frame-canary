import * as environment from './environment.d.ts'
import * as rpc from './rpc.d.ts'
import * as restore from './restore.d.ts'
import * as state from './state.d.ts'
import * as ethProvider from './ethProvider.d.ts'

type NullableTimeout = NodeJS.Timeout | null
export type Callback<T> = (err: Error | null, result?: T) => void
