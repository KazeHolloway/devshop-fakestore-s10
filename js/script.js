// Variable globale qui va garder en mémoire TOUS les produits recupérés pour pouvoir filtrer sans refaire un fetch à chaque fois.
let allProducts = [];

// Nouvelle variable globale qui retient quelle catégorie est currently filtrée. Par défaut à "all" pour signifier qu'aucun filtre de catégorie n'est appliqué.
let currentCategory = "all";

// tableau qui contiendra les produits ajoutés au panier.
let cart = [];

// On déclare notre fonction principale asynchrone
async function getProducts() {

    // On récupère l'élément qui affichera l'état (chargement / erreur)
    const statusMessage = document.getElementById("status-message");
    
    // On affiche le message de chargement avant de lancer le fetch, avec un petit rond qui sera animé en CSS (class "spinner")
    statusMessage.innerHTML = `
        <div class="loader">
        <div class="spinner"></div>
        <p>Chargement...</p>
        </div>
    `;

    // Ce bloc contient le code qui peut potentiellement générer une erreur lors de l'exécution
    try{
        // fetch() a deux missions : il envoie une request vers l'URL de l'API et il return une "Promise". await lui met en pause cette fonction uniquement jusqu'à l'arrivée de la réponse.
        const response = await fetch("https://fakestoreapi.com/products");

        // response contient la réponse brute du serveur mais pas encore les données exploitables. On doit convertir cette réponse en JSON avec .json()
        const products = await response.json();

        // à ce stade "products" est un vrai tableau d'objets JavaScript; on l'affiche dans la console pour voir à quoi ça ressemble
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

        // Une fois les produits affichés, on vide le message
        statusMessage.innerHTML = "";

    } catch (error) {
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

// Définissons la fonction displayProducts() que nous avons appelée dans getProducts(). Cette fonction prend un tableau de produits et les affiche dans le DOM
function displayProducts(products) {

    // On récupère via l'id l'élément HTML qui va contenir toutes les cartes (c'est notre <main> dans index.html)
    const grid = document.getElementById("products-grid");

    // On vide la grille au cas où elle contiendrait déjà quelque chose, utile pour filtrer/rechercher
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

        // On injecte ce div avec du contenu HTML de la carte produit, en utilisant les infos du produit courant (grâce aux backticks et ${} pour l'interpolation)
        card.innerHTML = `
            <img src="${product.image}" alt="${product.title}">
            <h3>${product.title}</h3>
            <p class="price">${product.price} €</p>
            <p class="category">${product.category}</p>
            <button class="add-to-cart" data-id="${product.id}">Ajouter</button>
        `;

        // On ajoute enfin cette carte dans la grille, elle devient ainsi visible.
        grid.appendChild(card);
    });

    // Once all les cards injected, on active leur bouton "Ajouter"
    setupAddToCartButtons();
}

// Fonction qui attache un listener de click à chaque bouton "Ajouter"
function setupAddToCartButtons() {
    const buttons = document.querySelectorAll(".add-to-cart");

    buttons.forEach(button => {
        button.addEventListener("click", () => {

            // data-id a été stocké as a string dans le HTML, on le convertit en number
            const productId = Number(button.dataset.id);

            // .find() cherche et retourne le first élément qui correspond à la condition
            const product = allProducts.find(p => p.id === productId);

            addToCart(product);
        });
    });
}

// Fonction qui ajoute un produit au panier, update le compteur ET gère les doublons en incrémentant la quantité
function addToCart(product) {

    // .find() cherche si ce produit est déjà présent dans le panier
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        // déjà présent : on incrémente juste sa quantité !
        existingItem.quantity += 1;
    } else {
        // absent : on ajoute une nouvelle entrée avec quantité 1. Et on ne garde que les champs utiles au panier
        cart.push({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }

    showToast(`"${product.title}" ajouté au panier !`);
    updateCartCount();
    saveCartToStorage();
    renderCartDrawer();
}

// Fonction qui augmente la quantité d'un article déjà dans le panier
function increaseQuantity(productId) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += 1;
        updateCartCount();
        saveCartToStorage();
        renderCartDrawer();
    }
}

// Fonction qui diminue la quantité, et supprime l'article si elle tombe à 0
function decreaseQuantity(productId) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity -= 1;

        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateCartCount();
            saveCartToStorage();
            renderCartDrawer();
        }
    }
}

// Fonction qui supprime complètement un article du panier
function removeFromCart(productId) {
    // .filter() ici garde tous les articles SAUF celui dont l'id correspond
    cart = cart.filter(item => item.id !== productId);
    updateCartCount();
    saveCartToStorage();
    renderCartDrawer();
}

// Fonction qui update le chiffre affiché dans la navbar
function updateCartCount() {
    const cartCount = document.getElementById("cart-count");

    // .reduce() additionne les quantités de tous les articles pour avoir le nombre total de produits dans le panier
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;
}

// Fonction qui génère le contenu visuel du tiroir panier
function renderCartDrawer() {
    const container = document.getElementById("cart-drawer-items");
    const totalDisplay = document.getElementById("cart-total");

    container.innerHTML = "";

    if (cart.length === 0) {
        container.innerHTML = `<p class="cart-empty">Votre panier est vide.</p>`;
        totalDisplay.textContent = "0";
        return;
    }

    let total = 0;

    cart.forEach(item => {
        // prix total pour cette ligne (prix unitaire x quantité)
        const lineTotal = item.price * item.quantity;
        total += lineTotal;

        const row = document.createElement("div");
        row.classList.add("cart-item");

        row.innerHTML = `
            <img src="${item.image}" alt="${item.title}">
            <div class="cart-item-body">
                <div class="cart-item-top">
                    <span class="cart-item-title">${item.title}</span>
                    <button class="cart-item-remove" data-id="${item.id}" aria-label="Supprimer">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 6H21M8 6V4C8 3.45 8.45 3 9 3H15C15.55 3 16 3.45 16 4V6M19 6V20C19 20.55 18.55 21 18 21H6C5.45 21 5 20.55 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
                <div class="cart-item-bottom">
                    <span class="cart-item-price">${lineTotal.toFixed(2)} €</span>
                    <div class="cart-item-controls">
                        <button class="qty-btn decrease" data-id="${item.id}">-</button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-btn increase" data-id="${item.id}">+</button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(row);
    });
    totalDisplay.textContent = total.toFixed(2); // toFixed(2) arrondit le prix total à 2 chiffres après la virgule.
}

// Fonction qui ajoute les listeners aux boutons du tiroir
function setupCartDrawerListeners() {
    const container = document.getElementById("cart-drawer-items");

    container.addEventListener("click", (event) => {
        const increaseBtn = event.target.closest(".increase");
        const decreaseBtn = event.target.closest(".decrease");
        const removeBtn = event.target.closest(".cart-item-remove");

        if (increaseBtn) {
            increaseQuantity(Number(increaseBtn.dataset.id));
        } else if (decreaseBtn) {
            decreaseQuantity(Number(decreaseBtn.dataset.id));
        } else if (removeBtn) {
            removeFromCart(Number(removeBtn.dataset.id));
        }
    });

    const cartIcon = document.getElementById("cart-icon");
    const cartDrawer = document.getElementById("cart-drawer");
    const cartOverlay = document.getElementById("cart-overlay");
    const cartClose = document.getElementById("cart-close");

    function openCart() {
        cartDrawer.classList.add("open");
        cartOverlay.classList.add("visible");
    }

    function closeCart() {
        cartDrawer.classList.remove("open");
        cartOverlay.classList.remove("visible");
    }

    cartIcon.addEventListener("click", openCart);
    cartClose.addEventListener("click", closeCart);
    cartOverlay.addEventListener("click", closeCart);
}

// Fonction qui sauvegarde le panier dans le localStorage à chaque modification
function saveCartToStorage() {
    // localStorage ne stocke que du texte, on convertit donc notre tableau en JSON
    localStorage.setItem("devshop-cart", JSON.stringify(cart));
}

// Fonction qui charge le panier depuis le localStorage au démarrage de l'app
function loadCartFromStorage() {
    const savedCart = localStorage.getItem("devshop-cart");

    if (savedCart) {
        // JSON.parse() fait l'inverse de JSON.stringify() (texte -> tableau JS)
        cart = JSON.parse(savedCart);
    }

    updateCartCount();
    renderCartDrawer();
}

// Fonction qui affiche une notification toast en bas à droite et qui disparait toute seule
function showToast(message) {
    const container = document.getElementById("toast-container");

    const toast = document.createElement("div");
    toast.classList.add("toast");
    toast.innerHTML = `
        <svg class="toast-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // requestAnimationFrame attend le prochain rafraichissement d'affichage avant d'ajouter la classe "show", pour que la transition CSS se déclenche bien
    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    // après 3 secondes, on retire "show", puis on supprime l'élément
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Fonction qui gère le basculement entre thème clair et sombre
function setupThemeToggle() {
    const toggleButton = document.getElementById("theme-toggle");

    toggleButton.addEventListener("click", () => {
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        const newTheme = isDark ? "light" : "dark";

        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("devshop-theme", newTheme);
    });
}

// Fonction qui applique le thème sauvegardé au chargement de la page
function loadTheme() {
    const savedTheme = localStorage.getItem("devshop-theme");

    if (savedTheme) {
        document.documentElement.setAttribute("data-theme", savedTheme);
    }
}

// Fonction qui permet de générer les boutons de catégorie
function generateCategoryButtons(products) {

    const filtersContainer = document.getElementById("category-filters");
    filtersContainer.innerHTML = "";

    // products.map() transforme chaque produit en sa seule catégorie, puis new Set() élimine auto les doublons
    const categories = [...new Set(products.map(product => product.category))];

    // On crée d'abord un bouton "Tous" pour réafficher l'ensemble des produits
    const allButton = document.createElement("button");

    allButton.textContent = "Tous";
    allButton.classList.add("active"); // actif par défaut au chargement
    
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

// p'tite fonction utilitaire pour gérer la classe "active" visuellement, pour savoir quel bouton de catégorie est currently selectionnée
function setActiveButton(clickedButton) {
    const buttons = document.querySelectorAll(".category-filters button");
    buttons.forEach(btn => btn.classList.remove("active"));
    clickedButton.classList.add("active");
}

// écoute la saisie dans la search bar et applique le filtrage en temps réel
function setupSearchListener() {
    const searchInput = document.getElementById("search-input");
    const searchClear = document.getElementById("search-clear");

    // l'event "input" se déclenche à chaque frappe au clavier
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

// Fonction qui combine le filtrage par catégorie et la search par titre
function applyFilters() {
    const searchInput = document.getElementById("search-input");

    const searchTerm = searchInput.value.trim().toLowerCase();
    // .trim() enlève les espaces au début et à la fin & .toLowerCase() met toute saisie en minuscule

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

    // étape 3 : on affiche les produits filtrés
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

    // au clic sur le bouton, on remonte avec une animation fluide
    backToTopButton.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

// On appelle la fonction qui va attacher les listeners aux boutons du tiroir panier
setupCartDrawerListeners();

// On charge le panier depuis le localStorage au démarrage de l'app
loadCartFromStorage();

// On appelle la fonction qui va gérer le basculement entre thème clair et sombre
setupThemeToggle(); 

// On applique le thème sauvegardé au chargement de la page
loadTheme(); 

// On appelle enfin la fonction asynchrone pour qu'elle s'exécute
getProducts();