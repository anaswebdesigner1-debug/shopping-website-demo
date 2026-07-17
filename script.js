// =======================================
// Shopping Demo v2
// =======================================

const PRODUCT_FILE = "products.json";

let products = [];

let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Inject button styles for improved design
function injectButtonStyles(){
    if(document.getElementById('app-button-styles')) return;
    const style = document.createElement('style');
    style.id = 'app-button-styles';
    style.innerText = `
        .btn{cursor:pointer;border:0;padding:8px 12px;border-radius:6px;font-weight:600;transition:all .12s ease}
        .btn:active{transform:translateY(1px)}
        .btn-primary{background:#007bff;color:#fff;box-shadow:0 2px 6px rgba(0,123,255,.18)}
        .btn-outline{background:transparent;border:1px solid #ccc;color:#333}
        .btn-icon{background:#f1f1f1;color:#333;padding:6px 10px;border-radius:6px}
        .btn-small{padding:6px 8px;font-size:14px}
    `;
    document.head.appendChild(style);
}

injectButtonStyles();

const imageErrorCache = new Set();

function createToastContainer(){

    let container = document.getElementById("toast-container");

    if(container) return container;

    container = document.createElement("div");
    container.id = "toast-container";
    container.setAttribute("aria-live", "polite");
    container.setAttribute("aria-atomic", "true");

    document.body.appendChild(container);

    return container;

}

function showToast(message, type = "success"){

    const container = createToastContainer();
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const messageSpan = document.createElement("span");
    messageSpan.textContent = message;

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "toast-close";
    closeButton.setAttribute("aria-label", "Close notification");
    closeButton.textContent = "×";

    toast.appendChild(messageSpan);
    toast.appendChild(closeButton);
    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    const dismiss = () => {
        toast.classList.remove("show");
        toast.classList.add("hide");
        setTimeout(() => toast.remove(), 220);
    };

    closeButton.addEventListener("click", dismiss);

    clearTimeout(toast.timeoutId);
    toast.timeoutId = setTimeout(dismiss, 2600);

}

function handleImageError(image){
    if(image.dataset.errored) return;
    image.dataset.errored = "true";

    const failedSource = image.src || image.getAttribute("src") || "unknown";
    if(!imageErrorCache.has(failedSource)){
        imageErrorCache.add(failedSource);
        showToast("Image failed to load, using a placeholder.", "warning");
    }

    image.src = "images/placeholder.jpg";
}

function money(price){

    return Number(price).toLocaleString("en-EG") + " EGP";

}

function saveCart(){

    localStorage.setItem(

        "cart",

        JSON.stringify(cart)

    );

    updateCartCount();

}

function updateCartCount(){

    const badge = document.getElementById("cart-count");

    if(!badge) return;

    let total = 0;

    cart.forEach(item=>{

        total += item.quantity || 1;

    });

    badge.innerText = total;

}

async function loadProducts(){

    const response = await fetch(PRODUCT_FILE);

    products = await response.json();

    renderProducts(products);

    updateCartCount();

}

loadProducts();

// --------------------
// RENDER PRODUCTS
// --------------------

function renderProducts(list){

    const container = document.getElementById("products");

    if(!container) return;

    container.innerHTML = "";

    list.forEach(product=>{

        const inCart = cart.find(item=>item.id===product.id);
        const quantity = inCart ? inCart.quantity : 0;

        container.innerHTML += `

<div class="card">

    <div class="card-image">
        <a href="product.html?id=${product.id}">
        <img
            src="${product.image}"
            onerror="handleImageError(this)"
        >
        </a>
    </div>

    <div class="card-content">

        <h3>${product.name}</h3>

        <p class="price">

            ${money(product.price)}

        </p>

        <p>

            ${product.description}

        </p>

        <br>

        <a href="product.html?id=${product.id}">

            View Details

        </a>

        <br><br>

        <div class="quantity-controls" style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
            ${quantity === 0 ? `
                <button onclick="addToCart(${product.id})" style="flex:1;padding:8px;">Add to cart</button>
            ` : `
                <button onclick="decreaseQuantityById(${product.id})">−</button>
                <span style="font-weight:bold;flex:1;text-align:center;">${quantity}</span>
                <button onclick="addToCart(${product.id})">+</button>
            `}
        </div>

    </div>

</div>

`;

    });

}

// --------------------
// SEARCH
// --------------------

const search = document.getElementById("search");

if (search) {

    search.addEventListener("input", () => {

        const text = search.value.toLowerCase();

        const filtered = products.filter(product =>

            product.name.toLowerCase().includes(text)

        );

        renderProducts(filtered);

    });

}


// --------------------
// CATEGORIES
// --------------------

document.querySelectorAll(".category").forEach(button => {

    button.addEventListener("click", () => {

        document
            .querySelectorAll(".category")
            .forEach(btn => btn.classList.remove("active"));

        button.classList.add("active");

        const category = button.dataset.category;

        if (category === "All") {

            renderProducts(products);

        } else {

            const filtered = products.filter(product =>

                product.category === category

            );

            renderProducts(filtered);

        }

    });

});


// --------------------
// CART
// --------------------

function addToCart(id){

    const product = products.find(p=>p.id===id);

    const item = cart.find(p=>p.id===id);

    const isNewItem = !item;

    if(item){

        item.quantity++;

    }

    else{

        cart.push({

            ...product,

            quantity:1

        });

    }

    saveCart();

    renderProducts(products);

    loadCartPage();

    loadProductPage();

    if(isNewItem){
        showToast(product.name + " added to cart.");
    }

}

function decreaseQuantityById(id){

    const item = cart.find(p=>p.id===id);

    if(!item) return;

    item.quantity--;

    if(item.quantity <= 0){

        cart = cart.filter(p=>p.id!==id);

    }

    saveCart();

    renderProducts(products);

    loadCartPage();

    loadProductPage();

}


// --------------------
// PRODUCT PAGE
// --------------------

function renderRecommendationSection(product, allProducts) {
    const recommendations = allProducts
        .filter(item => item.category === product.category && item.id !== product.id)
        .slice(0, 4);

    if (recommendations.length === 0) {
        return "";
    }

    return `
        <section class="recommendations">
            <h2>Recommended in ${product.category}</h2>
            <div class="recommendations-grid">
                ${recommendations.map(rec => `
                    <article class="recommendation-card">
                        <a href="product.html?id=${rec.id}">
                            <img src="${rec.image}" onerror="handleImageError(this)" alt="${rec.name}">
                            <div class="recommendation-info">
                                <h3>${rec.name}</h3>
                                <p>${money(rec.price)}</p>
                            </div>
                        </a>
                    </article>
                `).join("")}
            </div>
        </section>
    `;
}

function loadProductPage() {

    const box = document.getElementById("product");

    if (!box) return;

    const id = Number(

        new URLSearchParams(location.search).get("id")

    );

    fetch(PRODUCT_FILE)

        .then(r => r.json())

        .then(data => {

            const product = data.find(p => p.id === id);

            if (!product) {

                box.innerHTML = "<h2>Product not found.</h2>";

                return;

            }

            const inCart = cart.find(item => item.id === product.id);
            const quantity = inCart ? inCart.quantity : 0;

            box.innerHTML = `

            <div class="product">

                <img src="${product.image}" onerror="handleImageError(this)">

                <div class="product-info">

                    <h1>${product.name}</h1>

                    <p class="category-label">Category: ${product.category}</p>

                    <p class="price">${money(product.price)}</p>

                    <p>${product.description}</p>

                    <div class="quantity-controls">
                        ${quantity === 0 ? `
                            <button onclick="addToCart(${product.id})" style="padding:8px;">Add to cart</button>
                        ` : `
                            <button onclick="decreaseQuantityById(${product.id})">−</button>
                            <span style="margin:0 10px;font-weight:bold;">${quantity}</span>
                            <button onclick="addToCart(${product.id})">+</button>
                        `}
                    </div>

                </div>

            </div>

            ${renderRecommendationSection(product, data)}

            `;

        });

}

loadProductPage();


// --------------------
// CART PAGE
// --------------------

function loadCartPage() {

    const box = document.getElementById("cart");

    if (!box) return;

    if (cart.length === 0) {

        box.innerHTML = "<h2>Your cart is empty.</h2>";

        return;

    }

    let total = 0;

    box.innerHTML = "";

    cart.forEach((item, index) => {

        const quantity = item.quantity || 1;
        const subtotal = item.price * quantity;

        total += subtotal;

        box.innerHTML += `

<div class="cart-item">

    <div style="display:flex;gap:10px;align-items:center;">
        <img src="${item.image}" onerror="handleImageError(this)" style="width:80px;height:80px;object-fit:cover;border-radius:6px;"> 
        <div>
            <h3 style="margin:0">${item.name}</h3>
            <p style="margin:4px 0">${money(item.price)}</p>
            <p style="margin:4px 0">Subtotal: <strong>${money(subtotal)}</strong></p>
        </div>
    </div>

    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
        <div>
            <button onclick="changeQuantity(${index}, -1)">−</button>
            <span style="margin:0 10px;font-weight:bold;">${quantity}</span>
            <button onclick="changeQuantity(${index}, 1)">+</button>
        </div>
        <div>
            <button onclick="removeItem(${index})">Remove</button>
        </div>
    </div>

</div>

`;

    });

    box.innerHTML += `

<div class="cart-total">

    <h2>Total: ${money(total)}</h2>

</div>

`;

}

loadCartPage();


function changeQuantity(index, amount){

    cart[index].quantity += amount;

    if(cart[index].quantity <= 0){

        cart.splice(index,1);

    }

    saveCart();

    renderProducts(products);

    loadCartPage();

}
// --------------------
// REMOVE ITEM
// --------------------

function removeItem(index){

    cart.splice(index,1);

    saveCart();

    renderProducts(products);

    loadCartPage();

}