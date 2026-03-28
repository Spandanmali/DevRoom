import express from 'express';
import { nanoid } from 'nanoid';
import supabase from '../lib/supabase.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to protect all routes in this file
router.use(authMiddleware);

/**
 * 1. POST /api/rooms
 * Create a new room
 * Body: { name, language }
 */
router.post('/', async (req, res) => {
    try {
        const { name, language = 'javascript' } = req.body;
        const userId = req.user.id; // from auth middleware

        if (!name) {
            return res.status(400).json({ error: 'Room name is required' });
        }

        // Generate unique 10-character room ID
        const roomId = nanoid(10);

        // Insert the room into the 'rooms' table
        const { data: room, error: roomError } = await supabase
            .from('rooms')
            .insert([{
                id: roomId,
                name,
                language,
                created_by: userId
            }])
            .select()
            .single();

        if (roomError) throw roomError;

        // Add the creator as a participant to their own room
        const { error: participantError } = await supabase
            .from('room_participants')
            .insert([{
                room_id: roomId,
                user_id: userId
            }]);

        if (participantError) throw participantError;

        return res.status(201).json(room);
    } catch (error) {
        console.error('Error creating room:', error);
        return res.status(500).json({ error: 'Failed to create room' });
    }
});

/**
 * 2. GET /api/rooms/:id
 * Retrieve room details and list of participants
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch the room details
        const { data: room, error: roomError } = await supabase
            .from('rooms')
            .select('*')
            .eq('id', id)
            .single();

        if (roomError) {
            if (roomError.code === 'PGRST116') { // PostgREST code for "No rows found"
                return res.status(404).json({ error: 'Room not found' });
            }
            throw roomError;
        }

        // Fetch room participants by joining with the 'users' table
        const { data: participants, error: participantsError } = await supabase
            .from('room_participants')
            .select(`
                joined_at,
                users ( id, email, name )
            `)
            .eq('room_id', id);

        if (participantsError) throw participantsError;

        // Flatten the data to make it cleaner for the client
        const formattedParticipants = participants.map(p => ({
            joined_at: p.joined_at,
            ...(p.users || {}) // fallback in case 'users' object is null / undefined
        }));

        return res.status(200).json({
            ...room,
            participants: formattedParticipants
        });
    } catch (error) {
        console.error('Error fetching room details:', error);
        return res.status(500).json({ error: 'Failed to fetch room details' });
    }
});

/**
 * 3. POST /api/rooms/:id/join
 * Join an existing room
 */
router.post('/:id/join', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verify that the room actually exists
        const { data: room, error: roomError } = await supabase
            .from('rooms')
            .select('id')
            .eq('id', id)
            .single();

        if (roomError || !room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        // Insert the user into 'room_participants'
        const { error: joinError } = await supabase
            .from('room_participants')
            .insert([{
                room_id: id,
                user_id: userId
            }]);

        if (joinError) {
            // Check if this is a PostgreSQL unique constraint violation (code 23505)
            // Meaning the user is already a participant
            if (joinError.code === '23505') {
                return res.status(200).json({ message: 'User already in the room' });
            }
            throw joinError;
        }

        return res.status(200).json({ message: 'Successfully joined the room' });
    } catch (error) {
        console.error('Error joining room:', error);
        return res.status(500).json({ error: 'Failed to join room' });
    }
});

/**
 * 4. DELETE /api/rooms/:id
 * Delete a room (only the creator can delete it)
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Retrieve the room to check its 'created_by' field
        const { data: room, error: roomError } = await supabase
            .from('rooms')
            .select('created_by')
            .eq('id', id)
            .single();

        if (roomError) {
            if (roomError.code === 'PGRST116') {
                return res.status(404).json({ error: 'Room not found' });
            }
            throw roomError;
        }

        // Ensure only the creator can delete the room
        if (room.created_by !== userId) {
            return res.status(403).json({ error: 'Unauthorized: Only the creator can delete this room' });
        }

        // Delete the room. Cascading in SQL will automatically clean up 'room_participants'
        const { error: deleteError } = await supabase
            .from('rooms')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        return res.status(200).json({ message: 'Room deleted successfully' });
    } catch (error) {
        console.error('Error deleting room:', error);
        return res.status(500).json({ error: 'Failed to delete room' });
    }
});

export default router;
