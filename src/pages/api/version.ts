export const prerender = false

import { createNewVersion, jsonWithR2 } from '@/lib/actions'
import type { APIRoute } from 'astro'

export const POST: APIRoute = async () => jsonWithR2(createNewVersion())
