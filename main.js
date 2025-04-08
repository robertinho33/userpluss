// userpluss/main.js
import { auth, db } from './firebase.js';
import { registerUser, registerFirstAdmin, loginUser, logoutUser, onAuthStateChanged, getUserRole, getUserData, hasUsers } from './auth.js';
import { collection, addDoc, getDocs, query, where, orderBy, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    console.log('Página carregada:', window.location.pathname);
    const logoutButton = document.getElementById('logoutButton');
    const userInfo = document.getElementById('userInfo');
    const loginButton = document.getElementById('loginButton');
    const loginModal = document.getElementById('loginModal') ? new bootstrap.Modal(document.getElementById('loginModal')) : null;

    onAuthStateChanged(auth, async (user) => {
        const page = window.location.pathname.split('/').pop() || 'index.html';
        console.log('Página atual:', page, 'Usuário logado:', user ? user.uid : 'Nenhum');

        const allowedPages = {
            'index.html': ['todos'],
            'register.html': ['todos'],
            'cadastro-usuario.html': ['admin'],
            'dashboard.html': ['admin', 'funcionario', 'caixa'],
            'comandas.html': ['admin', 'funcionario', 'caixa'],
            'produtos.html': ['admin'],
            'vendas.html': ['admin', 'funcionario', 'caixa'],
            'relatorios.html': ['admin', 'caixa'],
            'perfil.html': ['admin', 'funcionario', 'caixa'],
            'cliente.html': ['admin', 'funcionario'],
            'acesso-negado.html': ['todos']
        };

        if (user) {
            const role = await getUserRole(user.uid);
            const userData = await getUserData(user.uid);
            console.log('Role:', role, 'Dados do usuário:', userData);

            if (userInfo) {
                if (userData && userData.nome) {
                    userInfo.textContent = `${userData.nome} (${role})`;
                } else {
                    userInfo.textContent = `Usuário sem nome (${role})`;
                    console.warn(`Dados do usuário não encontrados para UID: ${user.uid}`);
                }
            }
            if (logoutButton) logoutButton.classList.remove('d-none');
            if (loginButton) loginButton.classList.add('d-none');

            document.getElementById('comandasLink')?.classList[role === 'admin' || role === 'funcionario' || role === 'caixa' ? 'remove' : 'add']('d-none');
            document.getElementById('produtosLink')?.classList[role === 'admin' ? 'remove' : 'add']('d-none');
            document.getElementById('vendasLink')?.classList[role === 'admin' || role === 'funcionario' || role === 'caixa' ? 'remove' : 'add']('d-none');
            document.getElementById('relatoriosLink')?.classList[role === 'admin' || role === 'caixa' ? 'remove' : 'add']('d-none');
            document.getElementById('cadastroUsuarioLink')?.classList[role === 'admin' ? 'remove' : 'add']('d-none');

            if (!allowedPages[page]?.includes(role) && page !== 'index.html') {
                console.log('Redirecionando para index.html: Permissão insuficiente');
                window.location.href = 'index.html';
                return;
            }

            if (page === 'index.html' || page === 'register.html') {
                console.log('Redirecionando para dashboard.html: Usuário logado');
                window.location.href = 'dashboard.html';
            }
            if (page === 'dashboard.html') carregarDashboard(user, role);
            if (page === 'comandas.html') carregarComandas(user, role);
            if (page === 'produtos.html') carregarProdutos(user, role);
            if (page === 'vendas.html') carregarVendas(user, role);
            if (page === 'relatorios.html') carregarRelatorios(user, role);
            if (page === 'perfil.html') carregarPerfil(user, role);
            if (page === 'cadastro-usuario.html') carregarCadastroUsuario(user, role);
        } else {
            if (logoutButton) logoutButton.classList.add('d-none');
            if (loginButton) loginButton.classList.remove('d-none');

            if (page !== 'index.html' && page !== 'register.html') {
                console.log('Redirecionando para index.html: Nenhum usuário logado');
                window.location.href = 'index.html';
            }
        }
    });

    if (logoutButton) logoutButton.addEventListener('click', () => logoutUser().then(() => window.location.href = 'index.html'));
    if (loginButton) loginButton.addEventListener('click', () => loginModal.show());

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const loginError = document.getElementById('loginError');
            try {
                await loginUser(email, password);
                loginModal.hide();
                if (loginError) loginError.classList.add('d-none');
            } catch (error) {
                console.error('Erro ao logar:', error);
                if (loginError) {
                    loginError.classList.remove('d-none');
                } else {
                    alert('Erro ao logar: ' + error.message);
                }
            }
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = document.getElementById('registerNome').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const companyNome = document.getElementById('companyNome').value;
            const companyCNPJ = document.getElementById('companyCNPJ').value;
            const companyTelefone = document.getElementById('companyTelefone').value;

            try {
                const user = await registerFirstAdmin(email, password, nome);
                await updateDoc(doc(db, 'users', user.uid), {
                    company: {
                        nome: companyNome,
                        cnpj: companyCNPJ,
                        telefone: companyTelefone
                    }
                });
                console.log('Admin registrado com sucesso');
                alert('Administrador registrado com sucesso!');
                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error('Erro ao registrar admin:', error);
                alert('Erro ao registrar: ' + error.message);
            }
        });
    }

    const cadastroForm = document.getElementById('cadastroForm');
    if (cadastroForm) {
        cadastroForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = document.getElementById('cadastroNome').value;
            const email = document.getElementById('cadastroEmail').value;
            const password = document.getElementById('cadastroPassword').value;
            const role = document.getElementById('cadastroTipo').value;
            await registerUser(email, password, nome, role);
            alert('Usuário cadastrado!');
            cadastroForm.reset();
        });
    }

    const alterarSenhaForm = document.getElementById('alterarSenhaForm');
    if (alterarSenhaForm) {
        alterarSenhaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const novaSenha = document.getElementById('novaSenha').value;
            await updateUserPassword(novaSenha);
            alert('Senha alterada com sucesso!');
            alterarSenhaForm.reset();
        });
    }
});

// Funções de carregamento (mantidas iguais)
async function carregarDashboard(user, role) {
    if (role === 'admin') {
        const hoje = new Date().toISOString().split('T')[0];
        const q = query(collection(db, 'comandas'), where('data', '==', hoje));
        const snapshot = await getDocs(q);
        document.getElementById('comandasDia').textContent = `Total: ${snapshot.size}`;
        const faturamento = snapshot.docs.reduce((sum, doc) => sum + (doc.data().total || 0), 0);
        document.getElementById('faturamentoDia').textContent = `R$${faturamento.toFixed(2)}`;
    } else {
        document.getElementById('comandasDia').textContent = 'Acesso restrito';
        document.getElementById('faturamentoDia').textContent = 'Acesso restrito';
    }
}

async function carregarComandas(user, role) {
    const comandaForm = document.getElementById('comandaForm');
    if (comandaForm && (role === 'admin' || role === 'funcionario')) {
        comandaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const cliente = document.getElementById('comandaCliente').value;
            const data = document.getElementById('comandaData').value;
            const servico = document.getElementById('comandaServico').value;
            const profissional = document.getElementById('comandaProfissional').value;
            await addDoc(collection(db, 'comandas'), { cliente, data, servicos: [{ servico, profissional, valor: 50 }], total: 50, status: 'aberta', criadoPor: user.uid });
            carregarComandas(user, role);
        });
    }
    const q = role === 'admin' ? query(collection(db, 'comandas')) : query(collection(db, 'comandas'), where('criadoPor', '==', user.uid));
    const snapshot = await getDocs(q);
    document.getElementById('tabelaComandas').innerHTML = snapshot.docs.map(doc => {
        const data = doc.data();
        return `<tr><td>${data.cliente}</td><td>${data.data}</td><td>${data.total}</td><td>${data.status}</td><td><button class="btn btn-sm btn-success fechar-comanda" data-id="${doc.id}">Fechar</button></td></tr>`;
    }).join('');
    document.querySelectorAll('.fechar-comanda').forEach(btn => {
        btn.addEventListener('click', async () => {
            await updateDoc(doc(db, 'comandas', btn.dataset.id), { status: 'fechada' });
            carregarComandas(user, role);
        });
    });
}

async function carregarProdutos(user, role) {
    if (role !== 'admin') window.location.href = 'index.html';
}

async function carregarVendas(user, role) {
    if (!['admin', 'funcionario', 'caixa'].includes(role)) window.location.href = 'index.html';
}

async function carregarRelatorios(user, role) {
    if (!['admin', 'caixa'].includes(role)) window.location.href = 'index.html';
    const q = query(collection(db, 'vendas'));
    const snapshot = await getDocs(q);
    const total = snapshot.docs.reduce((sum, doc) => sum + doc.data().total, 0);
    document.getElementById('faturamentoPeriodo').textContent = `Total: R$${total.toFixed(2)}`;
}

async function carregarPerfil(user, role) {
    document.getElementById('userDetails').textContent = `Email: ${user.email} | Role: ${role}`;
}

async function carregarCadastroUsuario(user, role) {
    if (role !== 'admin') window.location.href = 'index.html';
}