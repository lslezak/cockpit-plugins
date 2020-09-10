
const repolist = document.getElementById("repo-list")
const pk_client = cockpit.dbus("org.freedesktop.PackageKit");

// add a repository into the table
// see https://www.freedesktop.org/software/PackageKit/gtk-doc/Transaction.html#Transaction::RepoDetail
function add_repo_details(repo) {
    console.log("Found repository: ", repo);

    let tr = document.createElement("tr");
    tr.classList.add("listing-ct-item");

    let enabled = document.createElement("td");
    enabled.append(create_checkbox(repo[2]));

    let alias = document.createElement("td");
    alias.append(document.createTextNode(repo[0]));

    let name = document.createElement("td");
    name.append(document.createTextNode(repo[1]));

    tr.appendChild(enabled);
    tr.appendChild(alias);
    tr.appendChild(name);

    repolist.appendChild(tr);
}

function transaction_ready(transaction) {
    console.log("Created PackageKit transaction: ", transaction);

    // register a callback for the repository detail DBus signals from PackageKit,
    // must be done before (!) calling the GetRepoList() DBus method
    pk_client.subscribe({ interface: "org.freedesktop.PackageKit.Transaction", path: transaction, member: "RepoDetail" },
        function (path, iface, signal, args) { add_repo_details(args); });

    let tr_proxy = pk_client.proxy("org.freedesktop.PackageKit.Transaction", transaction);
    // wait until the proxy is loaded
    // https://cockpit-project.org/guide/latest/cockpit-dbus.html
    tr_proxy.wait()
        // then call GetRepoList(), argument 0 is a bitfield filter meaning no filtering
        // https://www.freedesktop.org/software/PackageKit/gtk-doc/Transaction.html#Transaction.GetRepoList
        .done(function () { tr_proxy.GetRepoList(0); });
}

function pk_list_repos() {
    let pk_proxy = pk_client.proxy("org.freedesktop.PackageKit", "/org/freedesktop/PackageKit");
    // wait until the proxy is loaded
    // https://cockpit-project.org/guide/latest/cockpit-dbus.html
    // then call CreateTransaction()
    // https://www.freedesktop.org/software/PackageKit/gtk-doc/PackageKit.html#PackageKit.CreateTransaction
    pk_proxy.wait().done(function () { pk_proxy.CreateTransaction().then(transaction_ready); });
}

function create_checkbox(checked) {
    let checkbox = document.createElement("i");
    checkbox.classList.add("fa");

    if (checked)
        checkbox.classList.add("fa-check-square-o");
    else
        checkbox.classList.add("fa-square-o");

    return checkbox;
}

// load the repositories
pk_list_repos();

// Send a 'init' message.  This tells integration tests that we are ready to go
cockpit.transport.wait(function () { });
