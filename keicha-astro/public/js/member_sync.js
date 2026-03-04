/**
 * js/member_sync.js
 * Real-time member profile synchronization utility.
 */

const MemberSync = {
    debounceTimer: null,
    lastSyncedData: null,

    /**
     * Sync member data to Firestore.
     * @param {Object} data - Member data including phone.
     */
    sync: async function (data) {
        // Validate phone: must be 10 digits starting with 09
        const phone = data.phone || '';
        if (!/^09\d{8}$/.test(phone)) {
            return;
        }

        // Remove phone from data object to avoid redundant field (it's the doc ID)
        const docData = { ...data };
        // We keep phone in the doc just in case, per schema

        // Deep equal check to prevent redundant writes
        const currentDataStr = JSON.stringify(docData);
        if (this.lastSyncedData === currentDataStr) return;

        if (this.debounceTimer) clearTimeout(this.debounceTimer);

        this.debounceTimer = setTimeout(async () => {
            try {
                if (typeof db === 'undefined' || typeof firebase === 'undefined') {
                    console.warn('[MemberSync] Firestore (db) not initialized.');
                    return;
                }

                console.log('[MemberSync] Syncing to Firestore (Real-time)...', docData);

                const memberRef = db.collection('members').doc(phone);

                await memberRef.set({
                    ...docData,
                    updated_at: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                this.lastSyncedData = currentDataStr;
                console.log('[MemberSync] Successfully synced.');
            } catch (error) {
                console.error('[MemberSync] Sync failed:', error);
            }
        }, 2000); // 2 seconds debounce
    },

    /**
     * Collect data from form field IDs and sync.
     * @param {Object} idMap - Mapping of member fields to DOM element IDs.
     */
    collectAndSync: function (idMap) {
        const data = {};
        for (const [key, id] of Object.entries(idMap)) {
            const el = document.getElementById(id);
            if (el) {
                data[key] = el.value.trim();
            }
        }

        if (data.phone) {
            this.sync(data);
        }
    }
};

window.MemberSync = MemberSync;
