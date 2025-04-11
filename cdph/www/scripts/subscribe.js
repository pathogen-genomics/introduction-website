import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-analytics.js";
import { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp } 
from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
fetch('/get-sensitive-data')
.then(response => response.json())
.then(data => {
    console.log("Retrieved firebase client");

    const firebaseConfig = {
        apiKey: data.apiKey,
        authDomain: data.authDomain,
        projectId: data.projectId,
        storageBucket: data.storageBucket,
        messagingSenderId: data.messagingSenderId,
        appId: data.appId,
        measurementId: data.measurementId
    };


// Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);
    const db = getFirestore(app);
    document.getElementById("subscriptionForm").addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const subscribeClusters = document.querySelector("input[name='subscribeClusters']").checked;
        const subscribeStrains = document.querySelector("input[name='subscribeStrains']").checked;
        const location = global_state.replace(/ /g,"_");

        let eventTypes = [];
        if (subscribeClusters) eventTypes.push("new_clusters");
        if (subscribeStrains) eventTypes.push("new_strains");

        if (eventTypes.length === 0) {
            alert("Please select at least one subscription option.");
            return;
        }

        try {
            // 1. Check if user exists, if not, create a new user
            const usersRef = collection(db, "users");
            const userQuery = query(usersRef, where("email", "==", email));
            const userSnapshot = await getDocs(userQuery);

            let userId;
            if (userSnapshot.empty) {
                const newUser = await addDoc(usersRef, {
                    email: email,
                    status: "active",
                    timestamp: serverTimestamp()
                });
                userId = newUser.id;
            } else {
                userId = userSnapshot.docs[0].id;
            }

            console.log("User ID:", userId);

            for (const eventType of eventTypes) {
                // 2. Check if event exists, if not, create it
                const eventsRef = collection(db, "events");
                const eventQuery = query(eventsRef, where("eventType", "==", eventType), where("location", "==", location));
                const eventSnapshot = await getDocs(eventQuery);

                let eventId;
                if (eventSnapshot.empty) {
                    const newEvent = await addDoc(eventsRef, {
                        eventType: eventType,
                        location: location,
                        cachedResult: '',
                        timestamp: serverTimestamp()
                    });
                    eventId = newEvent.id;
                } else {
                    eventId = eventSnapshot.docs[0].id;
                }

                console.log("Event ID:", eventId);

                // 3. Check if subscription exists, if not, create it
                const subscriptionsRef = collection(db, "subscriptions");
                const subscriptionQuery = query(subscriptionsRef, where("userId", "==", userId), where("eventId", "==", eventId));
                const subscriptionSnapshot = await getDocs(subscriptionQuery);
                
                let subscriptionId;
                if (subscriptionSnapshot.empty) {
                    const newSubscription = await addDoc(subscriptionsRef, {
                        userId: userId,
                        eventId: eventId,
                        timestamp: serverTimestamp()
                    });
                    subscriptionId = newSubscription.id;
                } else {
                    console.log("User already subscribed to event: ", eventType);
                    subscriptionId = subscriptionSnapshot.docs[0].id;
                }
                console.log("Subscription ID:", subscriptionId); 
            }
            alert("Subscription successful!");
            closeSubscribeModal();
        } catch (error) {
            console.error("Error processing subscription: ", error);
            alert("An error occurred. Please try again later.");
        }
    });
})
.catch(error => {
    console.error("Error fetching sensitive data:", error);
});