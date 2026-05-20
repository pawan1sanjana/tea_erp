// Example Supabase Backend Utilities
// This file shows how to use Supabase client for queries with RLS

const { supabaseClient, DB_TYPE } = require('../config/db-supabase');

// Middleware to extract JWT token from request
function getAuthToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// Verify JWT and get user info
async function verifyAuth(token) {
  if (!supabaseClient) {
    throw new Error('Supabase client not available');
  }

  try {
    const { data, error } = await supabaseClient.auth.getUser(token);
    if (error) throw error;
    return data.user;
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

// Get data with RLS applied (using authenticated client)
async function queryWithRLS(table, filters = {}, token) {
  try {
    let query = supabaseClient.from(table).select('*');

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        query = query.eq(key, value);
      }
    });

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(`Query failed: ${error.message}`);
  }
}

// Insert data with RLS
async function insertWithRLS(table, data, token) {
  try {
    const { data: result, error } = await supabaseClient
      .from(table)
      .insert([data])
      .select();

    if (error) throw error;
    return result[0];
  } catch (error) {
    throw new Error(`Insert failed: ${error.message}`);
  }
}

// Update data with RLS
async function updateWithRLS(table, id, data, token) {
  try {
    const { data: result, error } = await supabaseClient
      .from(table)
      .update(data)
      .eq('id', id)
      .select();

    if (error) throw error;
    return result[0];
  } catch (error) {
    throw new Error(`Update failed: ${error.message}`);
  }
}

// Delete data with RLS
async function deleteWithRLS(table, id, token) {
  try {
    const { error } = await supabaseClient
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

// Real-time subscription example
function subscribeToTable(table, callback, filter = {}) {
  if (!supabaseClient) {
    console.error('Supabase client not available for real-time');
    return null;
  }

  return supabaseClient
    .channel(`public:${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
      callback(payload);
    })
    .subscribe();
}

// Upload file to storage
async function uploadFile(bucket, path, file, token) {
  try {
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .upload(path, file);

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
}

// Get public file URL
function getPublicUrl(bucket, path) {
  const { data } = supabaseClient.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Get signed URL for private files
async function getSignedUrl(bucket, path, expiresIn = 3600) {
  try {
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    throw new Error(`Signed URL failed: ${error.message}`);
  }
}

module.exports = {
  getAuthToken,
  verifyAuth,
  queryWithRLS,
  insertWithRLS,
  updateWithRLS,
  deleteWithRLS,
  subscribeToTable,
  uploadFile,
  getPublicUrl,
  getSignedUrl,
};
