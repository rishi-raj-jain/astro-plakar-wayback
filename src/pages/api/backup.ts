export const prerender = false

import { backupCurrent, jsonWithR2 } from '@/lib/actions'
import type { APIRoute } from 'astro'

export const POST: APIRoute = async () => jsonWithR2(backupCurrent())
