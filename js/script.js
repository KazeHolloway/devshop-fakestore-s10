/** On déclare une fonction asynchrone (async) : function qui "attend" (await) 
 * une operation qui prend du temps, comme un appel réseau,
 * sans pour autant bloquer le reste du programme pendant ce temps.
 */

async function getProducts() {

    // On récupère l'élément qui affichera l'état (chargement / erreur)
    const statusMessage = document.getElementById("status-message");
    
    // On affiche le message de chargement AVANT de lancer le fetch,
    // avec un petit rond qui sera animé en CSS (class "spinner")
    statusMessage.innerHTML = `
        <div class="loader">
        <div class="spinner"></div>
        <p>Chargement...</p>
        </div>
    `;

    // Ce bloc contient le code qui peut potentiellement générer une erreur à l'execution
    try{
        /** fetch() a deux missions : il envoie une request vers l'URL de l'API 
         * et il return une "Promise" (une promesse de résultat futur). 
         * await lui met en pause cette fonction uniquement jusqu'à l'arrivée de la réponse.
         */
        const response = await fetch("https://fakestoreapi.com/products");

        /** response contient la réponse brute du serveur mais pas encore les donnees exploitables. 
         * On doit convertir cette réponse en JSON avec .json(), 
         * qui est elle-meme une méthode asynchrone, donc on met encore un await
         */
        const products = await response.json();

        // A ce stade, "products" est un vrai tableau d'objets JavaScript.
        // On l'affiche dans la console pour voir à quoi ca ressemble
        console.log(products);

        // On appelle une nouvelle fonction qui va se charger de l'affichage des produits
        displayProducts(products);

        // Une fois les produits affichés avec succès, on vide le message
        statusMessage.innerHTML = "";

    } catch(error){
        // Ce bloc ne s'exécute que si une erreur survient dans le try.
        console.error("Erreur survenue lors de la récupération des produits :", error);

        statusMessage.innerHTML = `
            <p class="error-message">  
                <strong>OUUPS ! :(</strong><br>
                <em>Une erreur est survenue lors du chargement des produits. Veuillez réessayer plus tard...</em>
            </p>
        `;
    }
}

// Définissons la fonction displayProducts() que nous avons appelée dans getProducts()
// Cette fonction prend le tableau de produits et les affiche dans le DOM

function displayProducts(products) {

    // On récupère via l'id l'élément HTML qui va contenir toutes les cartes,
    // c'est notre <main id="products-grid"> dans index.html
    const grid = document.getElementById("products-grid");

    // On vide la grille au cas où elle contiendrait déjà quelque chose
    // utile plus tard quand on fera le filtrage/recherche
    grid.innerHTML = "";

    // méthode forEach() pour parcourir chaque produit du tableau, one by one
    products.forEach(product => {
        
        // On crée un nouvel élément <div> en mémoire, elle n'est pas encore visible dans la grille
        const card = document.createElement("div");

        // On lui ajoute la classe CSS "product-card"
        card.classList.add("product-card");

        // On injecte ce div avec du contenu HTML de la carte produit en utilisant 
        // les infos du produit courant (grâce aux backticks et ${} pour l'interpolation)
        card.innerHTML = `
            <img src="${product.image}" alt="${product.title}">
            <h3>${product.title}</h3>
            <p class="price">${product.price} €</p>
            <p class="category">${product.category}</p>
            <button class="add-to-cart" data-id="${product.id}">Ajouter</button>
        `;
        
        // Notons que chaque élément a 8 attributs: category, description, 
        // id, image, price, rating, title et prototype
        // Mais selon la consigne, on va gérer image, title, price, category
        
        // On ajoute enfin cette carte dans la grille, elle devient ainsi visible.
        grid.appendChild(card);
    });
}

// On appelle enfin la fonction asynchrone pour qu'elle s'execute
getProducts();