import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem as MUISelectItem,
  InputLabel,
  FormControl,
  IconButton,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  createTheme,
  ThemeProvider,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to attach token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Type defs
interface Category {
  _id: string;
  name: string;
  description: string;
}
interface MenuEntry {
  _id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: Category | string;
  isAvailable?: boolean;
}
interface Order {
  _id: string;
  status: string;
  total: number;
  user: any;
  createdAt: string;
}
interface Ingredient {
  _id: string;
  name: string;
  price: number;
  picture?: string;
}

const orangeTheme = createTheme({
  palette: {
    primary: {
      main: "#FF6D00",
    },
    secondary: {
      main: "#FFAB40",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: "none",
          fontWeight: 600,
          padding: "8px 20px",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: "0 12px 20px rgba(255, 109, 0, 0.15)",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          padding: 16,
        },
      },
    },
  },
});

const Dashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [openIngredient, setOpenIngredient] = useState(false);
  const [currentIngredient, setCurrentIngredient] =
    useState<Partial<Ingredient> | null>(null);
  const [imageIngredientFile, setImageIngredientFile] = useState<File | null>(
    null,
  );

  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuEntry[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  const [openCategory, setOpenCategory] = useState(false);
  const [openMenuItem, setOpenMenuItem] = useState(false);
  const [currentCategory, setCurrentCategory] =
    useState<Partial<Category> | null>(null);
  const [currentMenuItem, setCurrentMenuItem] =
    useState<Partial<MenuEntry> | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean;
    type: "category" | "menuItem" | "ingredient";
    id: string | null;
    name: string;
  }>({ open: false, type: "category", id: null, name: "" });

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);

  // Fetch functions using api instance
  const fetchIngredients = async () => {
    try {
      const res = await api.get("/ingredients");
      setIngredients(res.data);
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Failed to fetch ingredients",
        severity: "error",
      });
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders");
      setOrders(res.data);
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Failed to fetch orders",
        severity: "error",
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Failed to fetch categories",
        severity: "error",
      });
    }
  };

  const fetchMenuItems = async () => {
    try {
      const res = await api.get("/menu-items");
      setMenuItems(res.data);
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Failed to fetch menu items",
        severity: "error",
      });
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchCategories();
    fetchMenuItems();
    fetchIngredients();
  }, []);

  // Orders stats
  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  // Ingredients CRUD
  const handleIngredientSave = async () => {
    try {
      const formData = new FormData();
      formData.append("name", currentIngredient?.name || "");
      formData.append("price", (currentIngredient?.price ?? 0).toString());
      if (imageIngredientFile) {
        formData.append("picture", imageIngredientFile);
      }

      if (currentIngredient?._id) {
        await api.post(`/ingredients/${currentIngredient._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/ingredients", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      setOpenIngredient(false);
      setCurrentIngredient(null);
      setImageIngredientFile(null);
      fetchIngredients();
      setSnackbar({
        open: true,
        message: "Ingredient saved successfully",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to save ingredient",
        severity: "error",
      });
      console.error(err);
    }
  };

  const handleIngredientDelete = async (id: string) => {
    try {
      await api.delete(`/ingredients/${id}`);
      fetchIngredients();
      setSnackbar({
        open: true,
        message: "Ingredient deleted",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to delete ingredient",
        severity: "error",
      });
      console.error(err);
    }
  };

  const handleIngredientImage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    setImageIngredientFile(file);
    setCurrentIngredient({
      ...currentIngredient,
      picture: URL.createObjectURL(file),
    });
  };

  // Category CRUD
  const handleCategorySave = async () => {
    try {
      if (currentCategory?._id) {
        await api.put(`/categories/${currentCategory._id}`, currentCategory);
      } else {
        await api.post("/categories", currentCategory);
      }
      setOpenCategory(false);
      setCurrentCategory(null);
      fetchCategories();
      setSnackbar({
        open: true,
        message: "Category saved successfully",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to save category",
        severity: "error",
      });
      console.error(err);
    }
  };

  const handleCategoryDelete = async (id: string) => {
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
      setSnackbar({
        open: true,
        message: "Category deleted",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to delete category",
        severity: "error",
      });
      console.error(err);
    }
  };

  // Menu item CRUD
  const handleMenuItemSave = async () => {
    try {
      const formData = new FormData();
      formData.append("name", currentMenuItem?.name || "");
      formData.append("description", currentMenuItem?.description || "");
      formData.append("price", (currentMenuItem?.price ?? 0).toString());

      const categoryId =
        typeof currentMenuItem?.category === "object"
          ? (currentMenuItem.category as Category)._id
          : currentMenuItem?.category || "";
      formData.append("category", categoryId);

      if (imageFile) {
        formData.append("image", imageFile);
      }

      if (currentMenuItem?._id) {
        await api.put(`/menu-items/${currentMenuItem._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/menu-items", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      setOpenMenuItem(false);
      setCurrentMenuItem(null);
      setImageFile(null);
      fetchMenuItems();
      setSnackbar({
        open: true,
        message: "Menu item saved successfully",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to save menu item",
        severity: "error",
      });
      console.error(err);
    }
  };

  const handleMenuItemDelete = async (id: string) => {
    try {
      await api.delete(`/menu-items/${id}`);
      fetchMenuItems();
      setSnackbar({
        open: true,
        message: "Menu item deleted",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to delete menu item",
        severity: "error",
      });
      console.error(err);
    }
  };

  const handleMenuItemImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    setImageFile(file);
    setCurrentMenuItem({
      ...currentMenuItem,
      image: URL.createObjectURL(file),
    });
  };

  const handleOrderStatusChange = async (
    orderId: string,
    newStatus: string,
  ) => {
    try {
      await api.put(`/orders/${orderId}`, {
        status: newStatus,
      });
      fetchOrders();
      setSnackbar({
        open: true,
        message: `Order ${newStatus}`,
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to update order",
        severity: "error",
      });
      console.error(err);
    }
  };

  const getCategorySelectValue = () => {
    if (
      typeof currentMenuItem?.category === "object" &&
      currentMenuItem?.category !== null
    ) {
      return (currentMenuItem.category as Category)._id;
    }
    if (typeof currentMenuItem?.category === "string") {
      return currentMenuItem.category;
    }
    return "";
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const openConfirmDeleteDialog = (
    type: "category" | "menuItem" | "ingredient",
    id: string,
    name: string,
  ) => {
    setConfirmDelete({ open: true, type, id, name });
  };

  const onConfirmDelete = async () => {
    if (confirmDelete.id) {
      if (confirmDelete.type === "category") {
        await handleCategoryDelete(confirmDelete.id);
      } else if (confirmDelete.type === "menuItem") {
        await handleMenuItemDelete(confirmDelete.id);
      } else if (confirmDelete.type === "ingredient") {
        await handleIngredientDelete(confirmDelete.id);
      }
      setConfirmDelete({ ...confirmDelete, open: false, id: null, name: "" });
    }
  };

  const onCancelDelete = () =>
    setConfirmDelete({ ...confirmDelete, open: false, id: null, name: "" });

  const handleLogoutClick = () => {
    localStorage.removeItem("token");
    onLogout();
  };

  return (
    <ThemeProvider theme={orangeTheme}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h4" fontWeight="bold" color="primary">
            Admin Dashboard
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleLogoutClick}
            sx={{ borderRadius: 12 }}
          >
            Logout
          </Button>
        </Box>

        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          aria-label="dashboard tabs"
          sx={{ mb: 4 }}
        >
          <Tab label="Overview" />
          <Tab label="Categories" />
          <Tab label="Menu Items" />
          <Tab label="Ingredients" />
          <Tab label="Orders" />
        </Tabs>

        {/* Overview Tab */}
        {tabIndex === 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            <Card
              sx={{
                flex: "1 1 250px",
                bgcolor: "primary.light",
                color: "white",
              }}
            >
              <CardContent>
                <Typography variant="h6">Total Orders</Typography>
                <Typography variant="h3" fontWeight="bold">
                  {totalOrders}
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: "1 1 250px", bgcolor: "orange", color: "white" }}>
              <CardContent>
                <Typography variant="h6">Pending Orders</Typography>
                <Typography variant="h3" fontWeight="bold">
                  {pendingOrders}
                </Typography>
              </CardContent>
            </Card>
            <Card
              sx={{
                flex: "1 1 250px",
                bgcolor: "primary.main",
                color: "white",
              }}
            >
              <CardContent>
                <Typography variant="h6">Completed Orders</Typography>
                <Typography variant="h3" fontWeight="bold">
                  {completedOrders}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Categories Tab */}
        {tabIndex === 1 && (
          <Box>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h5" color="primary">
                Categories
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  setOpenCategory(true);
                  setCurrentCategory({});
                }}
              >
                Add Category
              </Button>
            </Box>

            <TableContainer
              component={Paper}
              sx={{ borderRadius: 4, boxShadow: 4 }}
            >
              <Table>
                <TableHead
                  sx={{
                    bgcolor: "primary.main",
                    "& th": { color: "white", fontWeight: "bold" },
                  }}
                >
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category._id} hover>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>{category.description}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => {
                            setOpenCategory(true);
                            setCurrentCategory(category);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() =>
                            openConfirmDeleteDialog(
                              "category",
                              category._id,
                              category.name,
                            )
                          }
                          aria-label={`delete category ${category.name}`}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Add/Edit Category Dialog */}
            <Dialog
              open={openCategory}
              onClose={() => setOpenCategory(false)}
              fullWidth
              maxWidth="sm"
            >
              <DialogTitle>
                {currentCategory?._id ? "Edit Category" : "Add Category"}
              </DialogTitle>
              <DialogContent dividers>
                <TextField
                  autoFocus
                  margin="normal"
                  label="Name"
                  fullWidth
                  size="medium"
                  value={currentCategory?.name || ""}
                  onChange={(e) =>
                    setCurrentCategory({
                      ...currentCategory,
                      name: e.target.value,
                    })
                  }
                  required
                />
                <TextField
                  margin="normal"
                  label="Description"
                  fullWidth
                  multiline
                  minRows={3}
                  size="medium"
                  value={currentCategory?.description || ""}
                  onChange={(e) =>
                    setCurrentCategory({
                      ...currentCategory,
                      description: e.target.value,
                    })
                  }
                />
              </DialogContent>
              <DialogActions sx={{ pr: 3, pb: 2 }}>
                <Button onClick={() => setOpenCategory(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleCategorySave}>
                  Save
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        )}

        {/* Menu Items Tab */}
        {tabIndex === 2 && (
          <Box>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h5" color="primary">
                Menu Items
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  setOpenMenuItem(true);
                  setCurrentMenuItem({});
                }}
              >
                Add Menu Item
              </Button>
            </Box>

            <TableContainer
              component={Paper}
              sx={{ borderRadius: 4, boxShadow: 4 }}
            >
              <Table>
                <TableHead
                  sx={{
                    bgcolor: "primary.main",
                    "& th": { color: "white", fontWeight: "bold" },
                  }}
                >
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {menuItems.map((item) => (
                    <TableRow key={item._id} hover>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        {typeof item.category === "object" &&
                        item.category !== null
                          ? (item.category as Category).name
                          : item.category}
                      </TableCell>
                      <TableCell>${item.price.toFixed(2)}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => {
                            setOpenMenuItem(true);
                            setCurrentMenuItem(item);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() =>
                            openConfirmDeleteDialog(
                              "menuItem",
                              item._id,
                              item.name,
                            )
                          }
                          aria-label={`delete menu item ${item.name}`}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Add/Edit Menu Item Dialog */}
            <Dialog
              open={openMenuItem}
              onClose={() => {
                setOpenMenuItem(false);
                setImageFile(null);
              }}
              fullWidth
              maxWidth="sm"
            >
              <DialogTitle>
                {currentMenuItem?._id ? "Edit Menu Item" : "Add Menu Item"}
              </DialogTitle>
              <DialogContent dividers>
                <TextField
                  autoFocus
                  margin="normal"
                  label="Name"
                  fullWidth
                  size="medium"
                  value={currentMenuItem?.name || ""}
                  onChange={(e) =>
                    setCurrentMenuItem({
                      ...currentMenuItem,
                      name: e.target.value,
                    })
                  }
                  required
                />
                <TextField
                  margin="normal"
                  label="Description"
                  fullWidth
                  multiline
                  minRows={3}
                  size="medium"
                  value={currentMenuItem?.description || ""}
                  onChange={(e) =>
                    setCurrentMenuItem({
                      ...currentMenuItem,
                      description: e.target.value,
                    })
                  }
                />
                <TextField
                  margin="normal"
                  label="Price"
                  fullWidth
                  type="number"
                  size="medium"
                  inputProps={{ min: 0, step: 0.01 }}
                  value={
                    currentMenuItem?.price !== undefined
                      ? currentMenuItem.price
                      : ""
                  }
                  onChange={(e) =>
                    setCurrentMenuItem({
                      ...currentMenuItem,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                />
                <FormControl fullWidth margin="normal" size="medium" required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={getCategorySelectValue()}
                    label="Category"
                    onChange={(e) =>
                      setCurrentMenuItem({
                        ...currentMenuItem,
                        category: e.target.value,
                      })
                    }
                  >
                    {categories.map((cat) => (
                      <MUISelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </MUISelectItem>
                    ))}
                  </Select>
                </FormControl>
                <Box mt={2}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMenuItemImage}
                    id="menu-image-upload"
                    style={{ display: "none" }}
                  />
                  <label htmlFor="menu-image-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<EditIcon />}
                    >
                      {currentMenuItem?.image ? "Change Image" : "Upload Image"}
                    </Button>
                  </label>
                  {currentMenuItem?.image && (
                    <Box mt={2}>
                      <img
                        src={currentMenuItem.image}
                        alt="Preview"
                        style={{
                          width: 100,
                          height: "auto",
                          borderRadius: 8,
                          boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </DialogContent>
              <DialogActions sx={{ pr: 3, pb: 2 }}>
                <Button
                  onClick={() => {
                    setOpenMenuItem(false);
                    setImageFile(null);
                  }}
                >
                  Cancel
                </Button>
                <Button variant="contained" onClick={handleMenuItemSave}>
                  Save
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        )}

        {/* Ingredients Tab*/}
        {tabIndex === 3 && (
          <Box>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h5" color="primary">
                Ingredients
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  setOpenIngredient(true);
                  setCurrentIngredient({});
                }}
              >
                Add Ingredient
              </Button>
            </Box>

            <TableContainer
              component={Paper}
              sx={{ borderRadius: 4, boxShadow: 4 }}
            >
              <Table>
                <TableHead
                  sx={{
                    bgcolor: "primary.main",
                    "& th": { color: "white", fontWeight: "bold" },
                  }}
                >
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Picture</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ingredients.map((ingredient) => (
                    <TableRow key={ingredient._id} hover>
                      <TableCell>{ingredient.name}</TableCell>
                      <TableCell>${ingredient.price.toFixed(2)}</TableCell>
                      <TableCell>
                        {ingredient.picture && (
                          <img
                            src={ingredient.picture}
                            alt={ingredient.name}
                            style={{
                              width: 50,
                              height: "auto",
                              borderRadius: 6,
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => {
                            setOpenIngredient(true);
                            setCurrentIngredient(ingredient);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() =>
                            openConfirmDeleteDialog(
                              "ingredient",
                              ingredient._id,
                              ingredient.name,
                            )
                          }
                          aria-label={`delete ingredient ${ingredient.name}`}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Add/Edit Ingredient Dialog */}
            <Dialog
              open={openIngredient}
              onClose={() => {
                setOpenIngredient(false);
                setImageIngredientFile(null);
              }}
              fullWidth
              maxWidth="sm"
            >
              <DialogTitle>
                {currentIngredient?._id ? "Edit Ingredient" : "Add Ingredient"}
              </DialogTitle>
              <DialogContent dividers>
                <TextField
                  autoFocus
                  margin="normal"
                  label="Name"
                  fullWidth
                  size="medium"
                  value={currentIngredient?.name || ""}
                  onChange={(e) =>
                    setCurrentIngredient({
                      ...currentIngredient,
                      name: e.target.value,
                    })
                  }
                  required
                />
                <TextField
                  margin="normal"
                  label="Price"
                  fullWidth
                  type="number"
                  size="medium"
                  inputProps={{ min: 0, step: 0.01 }}
                  value={
                    currentIngredient?.price !== undefined
                      ? currentIngredient.price
                      : ""
                  }
                  onChange={(e) =>
                    setCurrentIngredient({
                      ...currentIngredient,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                />
                <Box mt={2}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIngredientImage}
                    id="ingredient-image-upload"
                    style={{ display: "none" }}
                  />
                  <label htmlFor="ingredient-image-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<EditIcon />}
                    >
                      {currentIngredient?.picture
                        ? "Change Picture"
                        : "Upload Picture"}
                    </Button>
                  </label>
                  {currentIngredient?.picture && (
                    <Box mt={2}>
                      <img
                        src={currentIngredient.picture}
                        alt="Preview"
                        style={{
                          width: 100,
                          height: "auto",
                          borderRadius: 8,
                          boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </DialogContent>
              <DialogActions sx={{ pr: 3, pb: 2 }}>
                <Button
                  onClick={() => {
                    setOpenIngredient(false);
                    setImageIngredientFile(null);
                  }}
                >
                  Cancel
                </Button>
                <Button variant="contained" onClick={handleIngredientSave}>
                  Save
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        )}

        {/* Orders Tab */}
        {tabIndex === 4 && (
          <Box>
            <Typography variant="h5" color="primary" mb={2}>
              Orders
            </Typography>
            <TableContainer
              component={Paper}
              sx={{ borderRadius: 4, boxShadow: 4 }}
            >
              <Table>
                <TableHead
                  sx={{
                    bgcolor: "primary.main",
                    "& th": { color: "white", fontWeight: "bold" },
                  }}
                >
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order._id} hover>
                      <TableCell>{order._id}</TableCell>
                      <TableCell>{order.user?.name || "N/A"}</TableCell>
                      <TableCell>${order.total.toFixed(2)}</TableCell>
                      <TableCell>{order.status}</TableCell>
                      <TableCell>
                        {order.status === "pending" && (
                          <>
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              sx={{ mr: 1 }}
                              onClick={() =>
                                handleOrderStatusChange(order._id, "accepted")
                              }
                            >
                              Accept
                            </Button>
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              onClick={() =>
                                handleOrderStatusChange(order._id, "rejected")
                              }
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {order.status === "accepted" && (
                          <>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              sx={{ mr: 1 }}
                              onClick={() =>
                                handleOrderStatusChange(order._id, "completed")
                              }
                            >
                              Complete
                            </Button>
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              onClick={() =>
                                handleOrderStatusChange(order._id, "rejected")
                              }
                            >
                              Delete
                            </Button>
                          </>
                        )}
                        {["completed", "rejected"].includes(order.status) && (
                          <Typography variant="body2">
                            {order.status}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Confirm Delete Dialog */}
        <Dialog open={confirmDelete.open} onClose={onCancelDelete}>
          <DialogTitle
            display="flex"
            alignItems="center"
            gap={1}
            color="error.main"
          >
            <WarningAmberIcon /> Confirm Delete
          </DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete{" "}
              <strong>{confirmDelete.name}</strong>?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={onCancelDelete}>Cancel</Button>
            <Button variant="contained" color="error" onClick={onConfirmDelete}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar Notification */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity={snackbar.severity}
            variant="filled"
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
};

export default Dashboard;
