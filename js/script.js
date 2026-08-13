// Variable globale qui va garder en mémoire TOUS les produits recupérés,
// pour pouvoir filtrer sans refaire un fetch à chaque fois
let allProducts = [];

// Nouvelle variable globale qui retient quelle catégorie est currently filtrée
// Par défaut à "all" pour signifier qu'aucun filtre de catégorie n'est appliqué
let currentCategory = "all";

// tableau qui contiendra les produits ajoutes au panier
let cart = [];

/** On déclare une fonction async (qui "await"une operation qui prend du temps, 
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

        // response contient la réponse brute du serveur mais pas encore les donnees exploitables. 
        // On doit convertir cette réponse en JSON avec .json(), 
        const products = await response.json();

        // à ce stade "products" est un vrai tableau d'objets JavaScript.
        // On l'affiche dans la console pour voir à quoi ça ressemble
        console.log(products);

        // On sauvegarde les produits dans la variable globale
        allProducts = products;

        // On génère les boutons de catégorie à partir des produits reçus
        generateCategoryButtons(allProducts);

        // On appelle la fonction qui va se charger de l'affichage des produits
        displayProducts(products);

        // On active la search bar only once the products loaded
        setupSearchListener();

        // pour masquer/afficher le bouton "remonter en haut" selon le scroll
        setupBackToTop();

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
// Cette fonction prend un tableau de produits et les affiche dans le DOM

function displayProducts(products) {

    // On récupère via l'id l'élément HTML qui va contenir toutes les cartes,
    // c'est notre <main id="products-grid"> dans index.html
    const grid = document.getElementById("products-grid");

    // On vide la grille au cas où elle contiendrait déjà quelque chose
    // utile plus tard quand on fera le filtrage/recherche
    grid.innerHTML = "";

    // Si aucun produit ne correspond à la recherche, on affiche un message
    if (products.length === 0) {
        grid.innerHTML = `
            <p class="no-results">
                Aucun produit ne correspond à votre recherche. Essayez un autre mot-clé.
            </p>
        `;
        return; // on quitte la fonction ici, pas besoin de continuer à créer des cartes
    }

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

    // Once all les cartes injected, on active leurs boutons "Ajouter"
    setupAddToCartButtons();
}

// Fonction qui attache un listener de clic à chaque bouton "Ajouter"
function setupAddToCartButtons() {
    const buttons = document.querySelectorAll(".add-to-cart");

    buttons.forEach(button => {
        button.addEventListener("click", () => {

            // data-id a été stocké as string dans le HTML, on le convertit en entier
            const productId = Number(button.dataset.id);

            // .find() cherche et retourne le first élément qui correspond à la condition
            const product = allProducts.find(p => p.id === productId);

            addToCart(product);
        });
    });
}

// Fonction qui ajoute un produit au panier et update le compteur
function addToCart(product) {
    cart.push(product);
    updateCartCount();
}

// Fonction qui update le chiffre affiché dans la navbar
function updateCartCount() {
    const cartCount = document.getElementById("cart-count");
    cartCount.textContent = cart.length;
}


// Fonction qui permet de générer les boutons de catégorie
function generateCategoryButtons(products) {

    const filtersContainer = document.getElementById("category-filters");
    filtersContainer.innerHTML = "";

    // products.map() transforme chaque produit en sa seule categorie,
    // puis new Set() élimine auto les doublons,
    // et [...Set] reconvertit ça en tableau classique
    const categories = [...new Set(products.map(product => product.category))];

    // On crée d'abord un bouton "Tous" pour réafficher l'ensemble des produits
    const allButton = document.createElement("button");
    allButton.textContent = "Tous";
    allButton.classList.add("active"); // actif par défaut au chargement
    
    // On ajoute un écouteur d'event (click) sur le button, afin de call une fonction
    allButton.addEventListener("click", () => {
        setActiveButton(allButton);
        currentCategory = "all";
        applyFilters();
    });
    filtersContainer.appendChild(allButton);

    // Puis un bouton par catégorie unique trouvée
    categories.forEach(category => {
        const button = document.createElement("button");
        button.textContent = category;

        button.addEventListener("click", () => {
            setActiveButton(button); // fonction utilitaire définie plus bas
            currentCategory = category;
            applyFilters();
        });

        filtersContainer.appendChild(button);
    });
}

// p'tite fonction utilitaire pour gérer la classe "active" visuellement,
// pour savoir quel bouton de catégorie est currently selectionné
function setActiveButton(clickedButton) {
    const buttons = document.querySelectorAll(".category-filters button");
    buttons.forEach(btn => btn.classList.remove("active"));
    clickedButton.classList.add("active");
}

// écoute la saisie dans la search bar et applique le filtrage en temps réel
function setupSearchListener() {
    const searchInput = document.getElementById("search-input");
    const searchClear = document.getElementById("search-clear");

    // l'event "input" se déclenche à CHAQUE frappe au clavier
    searchInput.addEventListener("input", () => {
        applyFilters();
    });

    // Au clic sur la croix, on vide le champ de search et on relance le filtrage
    searchClear.addEventListener("click", () => {
        searchInput.value = "";
        applyFilters();
        searchInput.focus(); // remet le curseur dans le champ
    });
}

// Fonction centrale qui combine le filtrage par catégorie et search par titre
function applyFilters() {
    const searchInput = document.getElementById("search-input");

    const searchTerm = searchInput.value.trim().toLowerCase();
    // .trim() enlève les espaces au début et à la fin
    // .toLowerCase() met toute saisie en minuscule, 

    // On part de tous les produits, puis on filtre step by step
    let filtered = allProducts;

    // étape 1 : si une catégorie précise est selectionnée, on filtre dessus
    if (currentCategory !== "all") {
        filtered = filtered.filter(product => product.category === currentCategory);
    }

    // étape 2 : si l'user a tapé something, on filtre sur le titre
    if (searchTerm !== "") {
        filtered = filtered.filter(product =>
            product.title.toLowerCase().includes(searchTerm)
        );
    }

    displayProducts(filtered);
}

// Fonction qui gère l'affichage/masquage du bouton "remonter en haut" selon le scroll
function setupBackToTop() {
    const backToTopButton = document.getElementById("back-to-top");

    window.addEventListener("scroll", () => {

        // window.scrollY donne la distance (en pixels) déjà scrollée depuis le haut 
        if (window.scrollY > 400) {
            backToTopButton.classList.add("visible");
        } else {
            backToTopButton.classList.remove("visible");
        }
    });

    // au clic sur le bouton, on remonte en haut avec une animation fluide
    backToTopButton.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

// On appelle enfin la fonction asynchrone pour qu'elle s'exécute
getProducts();