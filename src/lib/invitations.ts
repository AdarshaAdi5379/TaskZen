/**
 * @fileOverview This file contains utility functions for managing project invitations.
 */

import { getFirebaseDb } from './firebase';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    writeBatch,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';

/**
 * Creates an invitation document in Firestore.
 * @param projectId - The ID of the project to invite the user to.
 * @param inviterId - The UID of the user sending the invitation.
 * @param inviteeEmail - The email of the user being invited.
 */
export async function createInvitation(projectId: string, inviterId: string, inviteeEmail: string): Promise<void> {
    const db = getFirebaseDb();

    // Check if user is already a member
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDocs(query(collection(db, 'projects'), where('__name__', '==', projectId)));
    
    if (!projectSnap.empty) {
        const projectData = projectSnap.docs[0].data();
        const members = projectData.members || [];
        
        // Check if the user is already in the members list by email
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', inviteeEmail));
        const userQuerySnapshot = await getDocs(q);

        if (!userQuerySnapshot.empty) {
            const userToShareWith = userQuerySnapshot.docs[0].data();
            if(members.includes(userToShareWith.uid)) {
                 throw new Error("This user is already a member of the project.");
            }
        }
    }


    // Check if an invitation for this email and project already exists
    const invitationsRef = collection(db, 'invitations');
    const existingInviteQuery = query(invitationsRef, 
        where('projectId', '==', projectId), 
        where('inviteeEmail', '==', inviteeEmail)
    );
    const existingInviteSnap = await getDocs(existingInviteQuery);

    if (!existingInviteSnap.empty) {
        throw new Error("An invitation for this user and project already exists.");
    }
    
    await addDoc(invitationsRef, {
        projectId,
        inviterId,
        inviteeEmail: inviteeEmail.toLowerCase(),
        status: 'pending',
        createdAt: serverTimestamp(),
    });
}

/**
 * Processes pending invitations for a user after they log in.
 * Adds the user to projects they've been invited to and deletes the invitations.
 * @param userId - The UID of the newly logged-in user.
 * @param userEmail - The email of the newly logged-in user.
 */
export async function processUserInvitations(userId: string, userEmail: string): Promise<void> {
    const db = getFirebaseDb();
    const invitationsRef = collection(db, 'invitations');
    const q = query(invitationsRef, where('inviteeEmail', '==', userEmail.toLowerCase()), where('status', '==', 'pending'));

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return;
    }

    const batch = writeBatch(db);

    querySnapshot.forEach(docSnap => {
        const invitation = docSnap.data();
        const projectId = invitation.projectId;
        
        // Add user to the project's members array
        const projectRef = doc(db, 'projects', projectId);
        batch.update(projectRef, {
            members: [...(invitation.members || []), userId]
        });

        // Delete the invitation
        batch.delete(docSnap.ref);
    });

    try {
        await batch.commit();
        console.log(`Processed ${querySnapshot.size} invitations for user ${userId}.`);
    } catch (error) {
        console.error("Error processing invitations:", error);
    }
}
